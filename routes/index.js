const express = require('express');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  console.log(req.session.currentUser)
  res.render('index', {user: req.session.currentUser});
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Add Spotify Podcast to database
router.post('/add-favorite', (req, res, next) => {
  console.log(req.body.spotifyid)
  // check if podcast with id is already in db
  Podcast.exists({podcastId: req.body.spotifyid})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: req.body.spotifyid})
    } else {
      return Podcast.findOne({podcastId: req.body.spotifyid})
    }
  })
  // Add ObjectId of newly created Podcast to Users favorite podcasts
  .then(resp => {
    console.log("Response from mongo:", resp)
    return User.findOneAndUpdate({_id: req.session.currentUser._id}, { $push: { favoritePodcasts: resp._id } }, {new: true})
  })
  // Redirect to Homepage
  .then(() => res.redirect("/userProfile"))
  .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
})

module.exports = router;