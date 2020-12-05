
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

// process form data

router.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  // const salt = bcrypt.genSaltSync(10);
  // const pwHash = bcrypt.hashSync(password, salt);

  if (!username || !email || !password) {
    res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.' });
    return;
  }

  // making sure that passwords are strong:

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      return User.create({
        // username: username
        username,
        email,
        password: hashedPassword
      });
    })
    .then(createdUser => {
      console.log('Newly created user is: ', createdUser);
      //Create a bookmark playlist 
      return Playlist.create({
        ownerID: createdUser._id,
        userName: createdUser.username,
        playlistName: "Bookmarked",
        episodes: [],
      })
    })
    .then(() => {
      res.redirect('/login')
    })

    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render('auth/signup', { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render('auth/signup', {
          errorMessage: 'Username and email need to be unique. Either username or email is already used.'
        });
      } else {
        next(error);
      }
    });
});

// router.get('/userProfile', (req, res) => res.render('users/user-profile'));

// module.exports = router;

//////////// L O G I N ///////////

// display the LOGIN form
router.get('/login', (req, res) => res.render('auth/login'));

// .post() login route ==> to process form data
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  console.log("SESSION: ", req.session)

  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.'
    });
    return;
  }

  User.findOne({ email })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
        return;
      } else if (bcryptjs.compareSync(password, user.password)) {
        //res.render("users/user-profile", {user});
        req.session.currentUser = user;
        res.redirect("/userProfile");
      } else {
        res.render('auth/login', { errorMessage: 'Incorrect password.' });
      }
    })
    .catch(error => next(error));
});


// Get user profile page and display favorite podcasts

router.get('/userProfile', (req, res) => {
  console.log(req.session.currentUser)
  console.log("Calling the user profile GET route")
  if (req.session.currentUser.favoritePodcasts !== null) {

    User.findOne({ _id: req.session.currentUser._id })
      .then(user => {
        const podcastDbIds = user.favoritePodcasts
        //console.log("DatabaseIDs: ", podcastDbIds)
        return Promise.all(podcastDbIds.map(async (id) => {
          return await Podcast.findOne({ _id: id })
        }))
      }).then(podcasts => {
        console.log("After map: ", podcasts) // Array of podcast objects in Mongobd incl. origin
        const podcastDetails = Promise.all(podcasts.map(async (podcast) => {
          //console.log(podcast.podcastId)
          if (podcast.origin === "spotify") {
            return await spotifyApi.getShow(podcast.podcastId, { market: "DE" })
          }
          else if (podcast.origin === "listennotes") {
            const lnResponse = await unirest.get(`https://listen-api.listennotes.com/api/v2/podcasts/${podcast.podcastId}?sort=recent_first`)
              .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
            return lnResponse.toJSON();
          }
        }))
        return podcastDetails
      })
      .then(allPodcasts => {
        //console.log("After 2nd map: ", allPodcasts)
        res.render('users/user-profile', { user: req.session.currentUser, podcasts: allPodcasts })
      })
  }
  else {
    res.render('users/user-profile', { user: req.session.currentUser })
  }

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
                image: episode.body.images[0],
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
        console.log("THIS IS THE PLAYLIST TOTAL : " + playlistObject)
        res.render('users/playlists', { playlistObject: playlistObject} )
      })
    })
})

module.exports = router;









