const express = require('express');
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
  Podcast.create({podcastId: req.body.spotifyid})
  // Add ObjectId of newly created Podcast to Users favorite podcasts
  .then(resp => {
    console.log("Response: " + resp.id);
    console.log("currentUser", req.session.currentUser._id)
    console.log("favoritePodcasts", req.session.currentUser.favoritePodcasts)
    //let updatedPodcasts = req.session.currentUser.favoritePodcasts.push(resp.id)
    return User.findOneAndUpdate({_id: req.session.currentUser._id}, { $push: { favoritePodcasts: resp.id } }, {new: true})
  })
  // Redirect to Homepage
  .then(() => res.redirect("/"))
  .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
})

module.exports = router;