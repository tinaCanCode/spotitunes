const axios = require('axios');
const express = require('express');
const router = express.Router();
//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
const Podcast = require('../models/Podcast');

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



  /* GET search page */
router.get('/', (req, res, next) => {
  res.render('spotify/search');
});

router.get("/search-results", (req, res) => {

  //console.log(req.query.podcast); // {podcast: "Testsearch"}

  spotifyApi
    //.search(req.query.podcast, ["track", "artist", "playlist", "show"])
    .searchShows(req.query.podcast, { market: "DE", limit: 6 })
    //.searchEpisodes(req.query.podcast)
    .then(data => {
      // console.log('The received data from the API about shows: ', data.body.shows.items);
      res.render("spotify/search-result", { podcasts: data.body.shows.items })
    })
    .catch(err => console.log('The error while searching artists occurred: ', err));
        
})



// DETAILS

router.get("/details/:showId", (req, res) => {
  console.log(req.params.showId)
    spotifyApi
    .getShow(req.params.showId
      , {market: "DE"}
    )
    .then(data => {
      console.log('The received data from the API about one show: ', data.body.episodes.items[0]);
      res.render("spotify/details", { podcasts: data.body })
    })
    .catch(err => console.log('The error while searching show occurred: ', err));
})


//  *********************COMMENTS SECTION***************************

// GET route to display the form to create a new comment

// router.get('/details/:showId', (req, res) => {
//   const { showId } = req.params;
//   Podcast.findById(showId)
//     .then(foundShow => res.render('spotify/details', foundShow))
//     .catch(err => console.log(`Err while getting a single show from the  DB: ${err}`));
// });

// ***************************************************

// Add Spotify Podcast to database
router.post('/details/:showId/newcomment', (req, res, next) => {

  const { showId } = req.params;
  const { content } = req.body;


  const newComment = { content: content, author: req.session.currentUser._id }


  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({podcastId: showId})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: showId})
    } else {
      return Podcast.findOne({podcastId: showId})
    }
  })
  // Add ObjectId of newly created Podcast 
  .then(resp => {
    console.log("Response from mongo:", resp)
    return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment} })
  // Redirect to Homepage
  .then(() => res.redirect(`/spotify/details/${showId}`))
  .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
})
});



// +++++++++++++++++++++++++++++++++++++++++++++++++++++

// router.post('/details/:showId', (req, res) => {
//   const { showId } = req.params;
//   const { content } = req.body;

  

//   const newComment = { content: content, author: req.session.user._id }

//   Podcast.findByIdAndUpdate(showId, { comments: { $push: newComment} })
//   .then(() => res.redirect(`/details/${showId}`))
// });
  



module.exports = router;
