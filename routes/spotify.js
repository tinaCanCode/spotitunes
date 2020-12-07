const express = require('express');
const router = express.Router();
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');


// setting the spotify-api goes here:
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Retrieve an access token
spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));

router.get("/details/:showId", (req, res) => {
  // console.log(req.params.showId)
  const fromSpotify = spotifyApi
    .getShow(req.params.showId
      , { market: "DE" })
  // .catch(err => console.log('The error while searching show occurred: ', err));

  const fromOurDb = Podcast.exists({ podcastId: req.params.showId })
    .then(podcastExists => {
      if (podcastExists) {
        return Podcast.findOne({ podcastId: req.params.showId })
      } else {
        return Podcast.create({ podcastId: req.params.showId })
      }
    })
    .catch(err => console.log('The error while searching show occurred: ', err));

  Promise.all([fromSpotify, fromOurDb]).then(values => {
    // console.log(values[1]);


    ////COMMENTS
    let valForComments = values[1].comments;
    let valForRating = values[1].rating;
    let userToCheckGet = req.session.currentUser._id
    let beingUser = valForRating.some(valForRating => valForRating['author'] == `${userToCheckGet}`)
    let beingCommentingUser = valForComments.some(valForComments => valForComments['author'] == `${userToCheckGet}`)

    let usersComment = valForComments.find((com) => {
      return com.author == userToCheckGet
    });
    console.log('hereeeeeeeeeee' + usersComment);

    //// RATINGS
    let sumRatings = (valForRating.reduce((sum, item) => sum + item.content, 0) / valForRating.length).toFixed(1)


    console.log(sumRatings);
    let usersRating = valForRating.find((rat) => {
      return rat.author == userToCheckGet
    });
    res.render("spotify/details", {
      podcasts: values[0].body, ourpodcasts: values[1], ratingResults: sumRatings, beingUser: beingUser,
      beingCommentingUser: beingCommentingUser, user: req.session.currentUser, usersRatingToPrint: usersRating, usersCommentToPrint: usersComment
    })
  })
});


//  *********************COMMENTS SECTION***************************

// Add Spotify Podcast to database
router.post('/details/:showId/newcomment', (req, res, next) => {
  const { showId } = req.params;
  const { content } = req.body;
  const newComment = { content: content, author: req.session.currentUser._id }

  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({ podcastId: showId })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: showId, origin: "spotify" })
      } else {
        return Podcast.findOne({ podcastId: showId })
      }
    })
    // Add ObjectId of newly created Podcast 
    .then(resp => {
      let commentsArrToCheck = resp.comments
      let userToCheckCom = req.session.currentUser._id
      let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
      console.log("=========>", hasCommented)

      if (!hasCommented) {
        return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      } else {
        let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
        console.log("=========>", newCommentArr)
        newCommentArr.push(newComment);
        return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      }
    })
});



// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/details/:showId/newrating', (req, res, next) => {
  const { showId } = req.params;
  const { content } = req.body;
  const newRating = { content: content, author: req.session.currentUser._id }

  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({ podcastId: showId })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: showId })
      } else {
        return Podcast.findOne({ podcastId: showId })
      }
    })
    // Add rating to Podcast 
    .then(respond => {
      let arrayToCheck = respond.rating
      let userToCheck = req.session.currentUser._id

      let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
      console.log("=========>", hasUser)

      if (!hasUser) {
        return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the rating in the DB: ${err}`));
      } else {

        let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
        console.log("=========>", newRatingArr)
        newRatingArr.push(newRating);
        return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
          // Redirect to Detailpage
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the rating in the DB: ${err}`));
      }
    })
})


// ********************************************************

// Add Spotify Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {
  // create new object in database
  // push this ID to user "favorites" array
  //console.log("THE PARAMS: " + req.params.id)

  Podcast.exists({ podcastId: req.params.id })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: req.params.id, origin: "spotify" })
      } else {
        return Podcast.findOne({ podcastId: req.params.id })
      }
    })
    // Add ObjectId of newly created Podcast to Users favorite podcasts
    .then(podcastToAdd => {
      console.log("Podcast you want to add:", podcastToAdd)
      console.log("current user: ", req.session.currentUser)
      // Check if podcast is already part of favorite podcasts
      User.findOne({ _id: req.session.currentUser._id })
        .then(user => {
          const userFavoritePodcasts = user.favoritePodcasts

          if (userFavoritePodcasts.includes(podcastToAdd._id.toString())) {
            res.send("You can't add podcasts twice")
          } else {
            return User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $push: { favoritePodcasts: podcastToAdd._id } }, { new: true })
          }

        })
        // Redirect to Homepage
        .then(() => res.redirect("/userProfile"))
        .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
    })
})


//addtoplaylist
router.post("/details/:podcastid/:id/addtoplaylist", (req, res) => {
  spotifyApi
    .getEpisode(req.params.id, { market: "DE" })
    .then((episode) => {
      console.log("THE ID OF THE EISODEEE: " + episode.body.id)
      Playlist.findOneAndUpdate(
        { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: "Bookmarked" }] },
        { $push: { episodes: { episodeID: episode.body.id, source: "spotify" } } })
        .then(() => {
          res.redirect(`/spotify/details/${req.params.podcastid}`)
        })
        .catch(err => console.log('The error while searching show occurred: ', err));
    })
})

router.post('/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
    .then(podcast => {
      console.log("Podcast we want to delete", podcast)
      User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
    })
  res.redirect("/userProfile");

})


module.exports = router;
