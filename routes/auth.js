
// const { Router } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/User')
const saltRounds = 10;
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');
const Podcast = require('../models/Podcast');

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
      res.redirect('/login');
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

router.get('/userProfile', (req, res) => {
  console.log(req.session.currentUser.favoritePodcasts)
  if(req.session.currentUser.favoritePodcasts !== null) {
    const podcastDbIds = req.session.currentUser.favoritePodcasts;

  // take id and find spotifyId in db
  const podcasts = Promise.all(podcastDbIds.map(async (id) => {
    return await Podcast.findOne({ _id: id })
  }))
    .then(podcasts => {
      const podcastDetails = Promise.all(podcasts.map(async (podcast) => {
        console.log(podcast.podcastId)
        return await spotifyApi.getShow(podcast.podcastId, {market: "DE"})
      }))
      return podcastDetails
    })
    .then(resp => {
      //console.log("Response:", resp)
      res.render('users/user-profile', { user: req.session.currentUser, podcasts: resp })
    })
  }
  else {
    res.render('users/user-profile', { user: req.session.currentUser})
  }

});

module.exports = router;









