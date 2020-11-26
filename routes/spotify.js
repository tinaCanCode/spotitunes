const axios = require('axios');
const express = require('express');
const router = express.Router();
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
router.get('/', (req, res, next) => {
  res.render('spotify/search');
});

router.get("/search-results", (req, res) => {

  console.log(req.query.podcast); // {podcast: "Testsearch"}

  //   axios({
  //     method: 'GET',
  //     url: 'https://api.spotify.com/v1/search',
  //     params: req.query
  //   })
  //     .then(response => {
  //       console.log("Search successful")
  //       res.render("spotify/search-result") //Add data
  //     })
  //     .catch(err => {
  //       console.log("There was an error")
  //     });
  // })


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




module.exports = router;
