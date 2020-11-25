const express = require('express');
const Podcast = require('../models/Podcast');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

// Add Spotify Podcast to database
router.post('/add-favorite', (req, res, next) => {
  console.log(req.body.spotifyid)
  Podcast.create({podcastId: req.body.spotifyid})
  // Add ObjectId of newly created Podcast to Users favorite podcasts
  .then(resp => console.log("Response: " + resp.id))
  // Redirect to Homepage
  .then(() => res.redirect("/"))
})

module.exports = router;