const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');

//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');

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
router.get('/search', (req, res, next) => {
  res.render('search');
});

router.get('/search-results', (req, res) => {
  //console.log("HERE IS THE QUERY: " + req.query.podcast)
  const listenNotesSearch = unirest.get(`https://listen-api.listennotes.com/api/v2/search?q=${req.query.podcast}&type=podcast`)
    .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  const spotifySearch = spotifyApi
    //.search(req.query.podcast, ["track", "artist", "playlist", "show"])
    .searchShows(req.query.podcast, { market: "DE", limit: 6 })
    //.searchEpisodes(req.query.podcast)

    Promise.all([listenNotesSearch,spotifySearch]).then((response) => {
      console.log("THIS IS THE SEARCH RESULT: " + response);
      console.log("THIS IS THE SEARCH RESULT NUMBER 1 LN: " + response[0].toJSON().body.results[0].title_original);
      console.log("THIS IS THE SEARCH RESULT SPTFY: " + response[1]);
      response[0].toJSON()
      res.render('search-results', { listenNotesResults: response[0].toJSON().body.results , spotifyResults: response[1].body.shows.items })
    })
    .catch(err => console.log('The error while searching artists occurred: ', err))
})


module.exports = router;
