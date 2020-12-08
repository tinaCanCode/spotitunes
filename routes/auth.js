
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

// display the signup form to users

router.get('/signup', (req, res) => {
  res.render('auth/signup')
});

// process form data

router.post('/signup', (req, res) => {
  const { username, email, password, repeatpassword } = req.body;
  // const salt = bcrypt.genSaltSync(10);
  // const pwHash = bcrypt.hashSync(password, salt);

  if (!username || !email || !password || !repeatpassword) {
    let preusername = username
    let preemail = email
    res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.', preusername: preusername, preemail:preemail});
    return;
  }
  else if (password != repeatpassword) {
    let preusername = username
    let preemail = email
    res.render('auth/signup', { errorMessage: 'The repeated password is not the same. Provide the password one more time', preusername: preusername, preemail:preemail });
    return;
  }

  // making sure that passwords are strong:

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    let preusername = username
    let preemail = email
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' , preusername: preusername, preemail:preemail});
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
      //console.log('Newly created user is: ', createdUser);
      //Create a bookmark playlist 
      return Playlist.create({
        ownerID: createdUser._id,
        userName: createdUser.username,
        playlistName: "Bookmarked",
        episodes: [],
        default : true
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
  //console.log("SESSION: ", req.session)

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

        // Checking if there is a pending request before the user logged in
        if (req.session.pendingRequest) {
          if (req.session.pendingRequest.origin === "spotify") {
            // user tried to add podcast to favorite without being logged in
            if (req.session.pendingRequest.action === "addtofavorite") {
              actions.addToFavorites(req.session.pendingRequest.podcastId, req.session.currentUser._id)
                .then(() => {
                  req.session.pendingRequest = null;
                  res.redirect("/userProfile")
                });
              // user tried to add a comment without being logged in
            } else if (req.session.pendingRequest.action === "comment") {
              actions.addComment(req.session.pendingRequest.podcastId, req.session.pendingRequest.commentContent, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId
                  req.session.pendingRequest = null;
                  res.redirect(`/spotify/details/${showId}`)
                });
              // user tried to rate podcast without being logged in
            } else if (req.session.pendingRequest.action === "rate") {
              actions.ratePodcast(req.session.pendingRequest.podcastId, req.session.pendingRequest.ratingContent, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId
                  req.session.pendingRequest = null;
                  res.redirect(`/spotify/details/${showId}`)
                });
              //user tried to add an episode without being logged in
            } else if (req.session.pendingRequest.action === "addtoplaylist") {
              actions.addToPlaylist(req.session.pendingRequest.episodeId, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId;
                  req.session.pendingRequest = null;
                  res.redirect(`/spotify/details/${showId}`)
                })
            }
            else {
              console.log("This action is not defined for spotify")
            }
          } else {
            // executed when the origin in the pendingRequest is listennotes
            // user tried to add podcast to favorite without being logged in
            if (req.session.pendingRequest.action === "addtofavorite") {
              actions.addToFavoritesLN(req.session.pendingRequest.podcastId, req.session.currentUser._id)
                .then(() => {
                  req.session.pendingRequest = null;
                  res.redirect("/userProfile")
                });
              // user tried to add a comment without being logged in
            } else if (req.session.pendingRequest.action === "comment") {
              actions.addCommentLN(req.session.pendingRequest.podcastId, req.session.pendingRequest.commentContent, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId
                  req.session.pendingRequest = null;
                  res.redirect(`/listennotes/details/${showId}`)
                });
              // user tried to rate podcast without being logged in
            } else if (req.session.pendingRequest.action === "rate") {
              actions.ratePodcastLN(req.session.pendingRequest.podcastId, req.session.pendingRequest.ratingContent, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId
                  req.session.pendingRequest = null;
                  res.redirect(`/listennotes/details/${showId}`)
                });
              //user tried to add an episode without being logged in
            } else if (req.session.pendingRequest.action === "addtoplaylist") {
              actions.addToPlaylistLN(req.session.pendingRequest.episodeId, req.session.currentUser._id)
                .then(() => {
                  const showId = req.session.pendingRequest.podcastId;
                  req.session.pendingRequest = null;
                  res.redirect(`/listennotes/details/${showId}`)
                })
            } else {
              console.log("This action is not defined for Listen Notes")
            }
          }
        } else {
          res.redirect("/userProfile");
        }

      } else {
        res.render('auth/login', { errorMessage: 'Incorrect password.' });
      }
    })
    .catch(error => next(error));
});

// Get user profile page and display favorite podcasts

router.get('/userProfile', (req, res) => {
  //console.log(req.session.currentUser)
  console.log("Calling the user profile GET route")
  if (req.session.currentUser.favoritePodcasts !== null) {

    User.findOne({ _id: req.session.currentUser._id })
      .then(user => {
        const podcastDbIds = user.favoritePodcasts
        console.log("DatabaseIDs: ", podcastDbIds)
        return Promise.all(podcastDbIds.map(async (id) => {
          return await Podcast.findOne({ _id: id })
        }))
      }).then(podcasts => {
        console.log("After map: ", podcasts) // Array of podcast objects in Mongobd incl. origin
        return Promise.all(podcasts.map(async (podcast) => {
          console.log(podcast.podcastId)
          if (podcast.origin === "spotify") {
            return await spotifyApi.getShow(podcast.podcastId, { market: "DE" })
          }
          else if (podcast.origin === "listennotes") {
            const lnResponse = await unirest.get(`https://listen-api.listennotes.com/api/v2/podcasts/${podcast.podcastId}?sort=recent_first`)
              .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
            return lnResponse.toJSON();
          }
        }))
        // console.log("PodcastDetails: ", podcastDetails)
        // return podcastDetails
      })
      .then(allPodcasts => {
        // console.log("THIS IS THE SPOTIFY REPSONSE :" + allPodcasts[3].body.name)
        res.render('users/user-profile', { user: req.session.currentUser, podcasts: allPodcasts })
      })
  }
  else {
    res.render('users/user-profile', { user: req.session.currentUser })
  }

});

module.exports = router;









