
// const { Router } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/User')
const Playlist = require('../models/Playlist')
const saltRounds = 10;
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const Podcast = require('../models/Podcast');
const unirest = require('unirest');

//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
const { findById } = require('../models/Podcast');

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

// display the signup form to users

router.get('/signup', (req, res) => {
  res.render('auth/signup')
});


// display playlist

router.get('/myplaylists', (req, res) => {
  Playlist.find({ ownerID: req.session.currentUser._id })
    .then((playlists) => {
      let playlistEpisodes = []
      let playlistObject = {
        name : playlists[0].playlistName,
        content : playlistEpisodes
      }
      let requestPromises = []
      // WORKS console.log("THIS IS THE PLAYLIST: " + playlists[0].episodes[0])
      for (let i = 0; i < playlists[0].episodes.length; i++) {
        if (playlists[0].episodes[i].source === "listennotes") {
          let request = unirest.get(`https://listen-api.listennotes.com/api/v2/episodes/${playlists[0].episodes[i].episodeID}`)
            .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
            .then((episode) => {
              // WORKS console.log("THIS IS THE EPiSODE : " + episode.body.title)
              let episodeSummary = {
                id: episode.body.id,
                title: episode.body.title,
                link: episode.body.link,
                image: episode.body.image,
                description: episode.body.description,
                podcast: episode.body.title,
                podcastID: episode.body.podcast.id,
              }
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST if : " + playlistEpisodes)

            })
          requestPromises.push(request)

        }
        else if (playlists[0].episodes[i].source === "spotify") {
          let request = spotifyApi
            .getEpisode(playlists[0].episodes[i].episodeID, { market: "DE" })
            .then((episode) => {
              // WORKS console.log("THIS IS THE EPiSODE : " + episode.body.name)
              let episodeSummary = {
                id: episode.body.id,
                title: episode.body.name,
                link: episode.body.external_urls.spotify,
                image: episode.body.images[0].url,
                description: episode.body.description,
                podcast: episode.body.show.name,
                podcastID: episode.body.show.id,
              }
              //WORKS console.log("THIS is THE EPOSIODE :" + episodeSummary.id)
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST else : " + playlistEpisodes)

            })
          requestPromises.push(request)
        }
      }

      Promise.all(requestPromises).then(() => {
        //console.log("THIS IS THE PLAYLIST TOTAL : " + playlistObject)
        res.render('users/playlists', { playlistObject: playlistObject} )
      })
    })
})

router.post('/playlists/:name/:id/delete', (req, res) => {
  console.log("THIS IS THE PARAMS : " + req.params.id)

  Playlist.findOneAndUpdate(
    { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: req.params.name }] },
    { $pull: { episodes: {episodeID: req.params.id }}})
  .then((playlist) => {
    console.log(playlist)
    res.redirect('/myplaylists')
  })
  .then(() => {
  })
})
  

module.exports = router;









