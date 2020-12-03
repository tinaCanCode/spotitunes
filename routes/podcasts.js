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
    .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
  const spotifySearch = spotifyApi
    .searchShows(req.query.podcast, { market: "DE", limit: 6 })

    console.log("LN: ", listenNotesSearch)

  Promise.all([listenNotesSearch, spotifySearch]).then((response) => {
    // console.log("THIS IS THE SEARCH RESULT: " + response);
    // console.log("THIS IS THE SEARCH RESULT NUMBER 1 LN: " + response[0].toJSON().body.results[0].title_original);
    // console.log("THIS IS THE SEARCH RESULT SPTFY: " + response[1]);


    // Values stored into variables
    let allResults = []
    let listenNotesResults = response[0].toJSON().body.results
    let spotifyResults = response[1].body.shows.items

    // Create smaller and uniformised ListenNotes podcasts object
    for (let i = 0; i < listenNotesResults.length; i++) {
      let resultSummary = {
        id: listenNotesResults[i].id,
        title: listenNotesResults[i].title_original,
        imageURL: listenNotesResults[i].image,
        description: listenNotesResults[i].description_original,
        origin: "listenNotes"
      }
      allResults.push(resultSummary)
    }

    // Create smaller and uniformised Spotify podcasts object
    for (let i = 0; i < spotifyResults.length; i++) {
      let resultSummary = {
        id: spotifyResults[i].id,
        title: spotifyResults[i].name,
        imageURL: spotifyResults[i].images[0].url,
        description: spotifyResults[i].description,
        origin: "spotify"
      }
      allResults.push(resultSummary)
    }

    // sort function for array of object 
    function compare(a, b) {
      if (a.title < b.title) {
        return -1;
      }
      if (a.title > b.title) {
        return 1;
      }
      return 0;
    }

    // Delete duplicates from allResults
    let uniqueResults = []
    allResults.forEach((o) => {
      if (!uniqueResults.some(obj => obj.title === o.title)) {
        uniqueResults.push(o);
      }
    });

    //console.log("TEST FOR MERGED RESULTS 1: " + allResults[0].title)
    res.render('search-results', { allResults: uniqueResults.sort(compare) })
  })
    .catch(err => console.log('The error while searching podcasts occurred: ', err))
})


module.exports = router;
