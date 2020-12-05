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

//logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// remove a podcast from the favorites Podcast array

router.post('/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
  .then(podcast => {
    console.log("Podcast we want to delete", podcast)
    return User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
  })
  res.redirect("/userProfile");
})


module.exports = router;