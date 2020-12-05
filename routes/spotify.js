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

// /* GET search page */
// router.get('/', (req, res, next) => {
//   res.render('spotify/search');
// });

// router.get("/search-results", (req, res) => {

//   //console.log(req.query.podcast); // {podcast: "Testsearch"}

//   spotifyApi
//     //.search(req.query.podcast, ["track", "artist", "playlist", "show"])
//     .searchShows(req.query.podcast, { market: "DE", limit: 6 })
//     //.searchEpisodes(req.query.podcast)
//     .then(data => {
//       // console.log('The received data from the API about shows: ', data.body.shows.items);
//       res.render("spotify/search-result", { podcasts: data.body.shows.items })
//     })
//     .catch(err => console.log('The error while searching artists occurred: ', err));

// })


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
        console.log('there is no such podcast in DB')
      }
    })
    .catch(err => console.log('The error while searching show occurred: ', err));

  Promise.all([fromSpotify, fromOurDb]).then(values => {
    // console.log(values[1]);

    let valForRating = values[1].rating;
    // counting the rating value
    const sumRatings = (valForRating.reduce((sum, item) => sum + item.content, 0) / valForRating.length).toFixed(1)
    console.log(sumRatings);


    res.render("spotify/details", { podcasts: values[0].body, ourpodcasts: values[1], ratingResults: sumRatings })
  })
})



// Promise.all([fromSpotify, fromOurDb]).then(values => {
//   console.log(values[1]);

// let valForRating = values[1];

// const sumRatings = valForRating.reduce((acc, rating)=>{
// acc[rating.content]=rating.content.reduce((acc, b) => acc+b, 0);

// return acc 
// // devide later through the length

// }, {});

//   res.render("spotify/details", {podcasts:values[0].body, ourpodcasts:values[1]})
// })

//  *********************COMMENTS SECTION***************************



// Add new comment to podcast
router.post('/details/:showId/newcomment', (req, res, next) => {

  if(!req.session.currentUser) {

    const requestedAction = {
      action: "comment",
      podcastId: req.params.showId,
      commentContent: req.body.content,
      origin: "spotify",
      message: "You need to login to add a comment"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", {pendingRequest: requestedAction})

  } else {

  actions.addToFavorites(req.params.id, req.session.currentUser._id)
  .then(() => res.redirect("/userProfile"));

  }

  if(!req.session.currentUser) {

    res.render("auth/login", {message: "You need to login to add a comment"})

  } else {

  

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
      // console.log("Response from mongo:", resp)
      return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
        // Redirect to Detailpage
        .then(() => res.redirect(`/spotify/details/${showId}`))
        .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
    })
  }
});



// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/details/:showId/newrating', (req, res, next) => {

  if(!req.session.currentUser) {

    res.render("auth/login", {message: "You need to login to add rate podcasts"})

  } else {

  

  const { showId } = req.params;
  const { content } = req.body;
  const newRating = { content: content, author: req.session.currentUser._id }

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
    // Add rating to Podcast 
    .then(respond => {
      let arrayToCheck = respond.rating
      let userToCheck = req.session.currentUser._id

      // arrayToCheck.map(e=>{
      //   console.log("eee=======>",e.author == userToCheck )
      // })

      let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
      console.log("=========>", hasUser)

      if (!hasUser) {
        return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      } else {             // console.log("Response from mongo:", respond)
        console.log('This user have already rated')
        res.redirect(`/spotify/details/${showId}`)
      }
    })
  }
})


// ********************************************************

// Add Spotify Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {

  //console.log("USER: ", req.session.currentUser)

  if(!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "spotify",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction

    console.log("SESSION: ", req.session)

    res.render("auth/login", {pendingRequest: requestedAction})

  } else {

  actions.addToFavorites(req.params.id, req.session.currentUser._id)
  .then(() => res.redirect("/userProfile"));

  }
})


//addtoplaylist
router.post("/details/:podcastid/:id/addtoplaylist", (req, res) => {

  if(!req.session.currentUser) {

    res.render("auth/login", {message: "You need to login to add episodes to your playlist"})

  } else {

  spotifyApi
    .getEpisode(req.params.id, { market: "DE" })
    .then((episode) => {
      console.log("THE ID OF THE EISODEEE: " + episode.body.id)
      Playlist.findOneAndUpdate(
        { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: "Bookmarked" }] },
        { $push: { episodes: { id: episode.body.id, title: episode.body.name, link: episode.body.external_urls.spotify, source: "spotify" } } })
        .then(() => {
          res.redirect(`/spotify/details/${req.params.podcastid}`)
        })
        .catch(err => console.log('The error while searching show occurred: ', err));
    })
  }
})



module.exports = router;
