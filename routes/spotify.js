const express = require('express');
const router = express.Router();
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');
const actions = require('../modules/actions');


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
      , { market: "DE", limit: '10' })
  // .catch(err => console.log('The error while searching show occurred: ', err));

  const fromOurDb = Podcast.exists({ podcastId: req.params.showId })
    .then(podcastExists => {
      if (podcastExists) {
        return Podcast.findOne({ podcastId: req.params.showId })
      } else {
        return Podcast.create({ podcastId: req.params.showId, origin: "spotify" })
      }
    })
    .catch(err => console.log('The error while searching show occurred: ', err));

  Promise.all([fromSpotify, fromOurDb]).then(values => {
    // console.log(values[1]);


    ////COMMENTS
    let valForComments = values[1].comments;
    let valForRating = values[1].rating;
    let userToCheckGet

    if (req.session.currentUser) {
      userToCheckGet = req.session.currentUser._id
    } else {
      userToCheckGet = null;
    }
    let beingUser = valForRating.some(valForRating => valForRating['author'] == `${userToCheckGet}`)
    let beingCommentingUser = valForComments.some(valForComments => valForComments['author'] == `${userToCheckGet}`)

    let usersComment = valForComments.find((com) => {
      return com.author == userToCheckGet
    });
    console.log('hereeeeeeeeeee' + usersComment);

    //// RATINGS
    let sumRatings = (valForRating.reduce((sum, item) => sum + item.content, 0) / valForRating.length).toFixed(1)
    let sumRatingsPrint
    console.log("sumRatings: ", sumRatings)
    console.log("Type: ", typeof (sumRatings))

    if (sumRatings === "NaN") {
      sumRatingsPrint = "No ratings yet"
    } else {
      sumRatingsPrint = sumRatings
    }
    console.log("sumRatingsPrint: ", sumRatingsPrint)
    //console.log(sumRatings);

    let usersRating = valForRating.find((rat) => {
      return rat.author == userToCheckGet
    });



    res.render("spotify/details", {
      podcasts: values[0].body, ourpodcasts: values[1], ratingResults: sumRatingsPrint, beingUser: beingUser,
      beingCommentingUser: beingCommentingUser, user: req.session.currentUser, usersRatingToPrint: usersRating, usersCommentToPrint: usersComment
    })
  })
});


//  *********************COMMENTS SECTION***************************


// Add new comment to podcast
router.post('/details/:showId/newcomment', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "comment",
      podcastId: req.params.showId,
      commentContent: req.body.content,
      origin: "spotify",
      message: "You need to log in to add a comment"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addComment(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/spotify/details/${req.params.showId}`));

  }

});

// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/details/:showId/newrating', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "rate",
      podcastId: req.params.showId,
      ratingContent: req.body.content,
      origin: "spotify",
      message: "You need to login to rate a podcasts"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.ratePodcast(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/spotify/details/${req.params.showId}`));

  }
});

// ********************************************************

// Add Spotify Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {

  //console.log("USER: ", req.session.currentUser)

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "spotify",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction

    console.log("SESSION: ", req.session)

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToFavorites(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect("/userProfile"));

  }
})


//addtoplaylist
router.post("/details/:podcastid/:id/addtoplaylist", (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtoplaylist",
      podcastId: req.params.podcastid,
      episodeId: req.params.id,
      origin: "spotify",
      message: "You need to login to bookmark episodes"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToPlaylist(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect(`/spotify/details/${req.params.podcastid}`));
  }
});

router.post('/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
    .then(podcast => {
      console.log("Podcast we want to delete", podcast)
      User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
    })
  res.redirect("/userProfile");

})


module.exports = router;
