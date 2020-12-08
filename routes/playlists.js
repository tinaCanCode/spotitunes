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

router.get('/playlists/:name', (req, res) => {
  Playlist.find({ ownerID: req.session.currentUser._id })
    .then((playlists) => {
      let currentPlaylist = playlists.find(playlist => playlist.playlistName.toLowerCase() == req.params.name.toLowerCase())
      let playlistsAll = playlists
      let playlistEpisodes = []
      let playlistObject = {
        name: currentPlaylist.playlistName,
        content: playlistEpisodes,
        default: currentPlaylist.default,
        id: currentPlaylist._id
      }
      let requestPromises = []
    //  console.log("THIS IS THE PLAYLIST: " + playlistsAll)
      for (let i = 0; i < currentPlaylist.episodes.length; i++) {
        if (currentPlaylist.episodes[i].source === "listennotes") {
          let request = unirest.get(`https://listen-api.listennotes.com/api/v2/episodes/${currentPlaylist.episodes[i].episodeID}`)
            .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
            .then((episode) => {
              // WORKS console.log("THIS IS THE EPiSODE : " + episode.body.title)
              let episodeSummary = {
                id: episode.body.id,
                title: episode.body.title,
                link: episode.body.link,
                podcast: episode.body.title,
                podcastID: episode.body.podcast.id,
                source : "listennotes"
              }
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST if : " + playlistEpisodes)

            })
          requestPromises.push(request)

        }
        else if (currentPlaylist.episodes[i].source === "spotify") {
          let request = spotifyApi
            .getEpisode(currentPlaylist.episodes[i].episodeID, { market: "DE" })
            .then((episode) => {
              // WORKS console.log("THIS IS THE EPiSODE : " + episode.body.name)
              let episodeSummary = {
                id: episode.body.id,
                title: episode.body.name,
                link: episode.body.external_urls.spotify,
                podcast: episode.body.show.name,
                podcastID: episode.body.show.id,
                source : "spotify"
              }
              //WORKS console.log("THIS is THE EPOSIODE :" + episodeSummary.id)
              playlistEpisodes.push(episodeSummary)
              //console.log("THIS IS THE PLAYLIST else : " + playlistEpisodes)

            })
          requestPromises.push(request)
        }
      }

      Promise.all(requestPromises).then(() => {
        res.render('users/playlists', { playlistObject: playlistObject, playlistsAll: playlistsAll, user: req.session.currentUser })
      })
    })
})

router.post('/bookmarks/:name/:id/delete', (req, res) => {
  console.log("THIS IS THE PARAMS : " + req.params.id)

  Playlist.findOneAndUpdate(
    { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: req.params.name }] },
    { $pull: { episodes: { episodeID: req.params.id } } })
    .then((playlist) => {
      console.log(playlist)
      res.redirect('/playlists/bookmarked')
    })
})

router.get("/bookmarks/new", (req, res) => {
  res.render("users/newplaylist")
})

router.post("/bookmarks/new", (req, res) => {
  Playlist.create({ ownerID: req.session.currentUser._id, userName: req.session.currentUser.username, playlistName: req.body.playlistname, default : false })
    .then(() => {
      res.redirect('/playlists/bookmarked')
    })
})

router.post("/bookmarks/:source/:episodeID", (req, res) => {
  console.log("2CHECKTHID OUTTOTUTOUT" + req.body.source)
  let addTo = Playlist.findOneAndUpdate(
    { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: req.body.selectpicker }] },
    { $push: { episodes: { episodeID: req.params.episodeID, source : req.params.source } } })


  let deleteFrom =
    Playlist.findOneAndUpdate(
      { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: "Bookmarked" }] },
      { $pull: { episodes: { episodeID: req.params.episodeID} } })

  Promise.all([addTo, deleteFrom]).then((response) => {
    res.redirect('/playlists/bookmarked')
  })
})

router.get("/playlist/:name/edit", (req, res) => {
  Playlist.find({ ownerID: req.session.currentUser._id })
    .then((playlists) => {
      let currentPLaylist = playlists.find(playlist => playlist.playlistName.toLowerCase() == req.params.name.toLowerCase())
      res.render("users/editplaylist", {playlist : currentPLaylist})
})
})

router.post("/playlist/:id/edit", (req, res) => {
  Playlist.findOneAndUpdate(
    { _id: req.params.id},
    { playlistName: req.body.playlistname })
    .then((playlist) => {
      console.log("CHECK THISO OUT" + playlist)
      res.redirect('/playlists/bookmarked')
    })
})

router.post("/playlist/:id/delete", (req, res) => {
  Playlist.findByIdAndDelete(req.params.id).then(() => {
    res.redirect('/playlists/bookmarked')
  })
})




module.exports = router;