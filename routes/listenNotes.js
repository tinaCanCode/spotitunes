const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');

/* GET search page */
router.get('/listennotes', (req, res, next) => {
  res.render('listenNotes/search');
});

router.get('/listennotes/search-results', (req, res) => {
  //console.log("HERE IS THE QUERY: " + req.query.podcast)
  unirest.get(`https://listen-api.listennotes.com/api/v2/search?q=${req.query.podcast}&type=podcast`)
    .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  .then((response) => {
    //console.log("the response: " + response.toJSON().body.results)
    response.toJSON()
    res.render('listenNotes/search-results-ln', {searchResults : response.toJSON().body.results})
  })
})

router.post('/listennotes/:id/addtofavorite', (req, res) => {
  // create new object in database
  // push this ID to user "favorites" array
  console.log("THE PARAMS: " + req.params.id)
  Podcast.exists({podcastId: req.params.id})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: req.params.id})
    } else {
      return Podcast.findOne({podcastId: req.params.id})
    }
  })
  res.send("added to favorites")
})


  // unirest.get(`https://listen-api.listennotes.com/api/v2/podcasts/${req.params.id}`)
  //   .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
  // .then((response) => {
  //   //console.log("the response: " + response.toJSON().body.results)
  //   response.toJSON()
  //   res.render('listenNotes/search-results', {searchResults : response.toJSON().body.results})
  // })
// })

// router.post('/add-favorite', (req, res, next) => {
//   console.log(req.body.spotifyid)
//   // check if podcast with id is already in db
//   Podcast.exists({podcastId: req.body.spotifyid})
//   .then(podcastExists => {
//     if (!podcastExists) {
//       return Podcast.create({podcastId: req.body.spotifyid})
//     } else {
//       return Podcast.findOne({podcastId: req.body.spotifyid})
//     }
//   })
//   // Add ObjectId of newly created Podcast to Users favorite podcasts
//   .then(resp => {
//     console.log("Response from mongo:", resp)
//     return User.findOneAndUpdate({_id: req.session.currentUser._id}, { $push: { favoritePodcasts: resp._id } }, {new: true})
//   })
//   // Redirect to Homepage
//   .then(() => res.redirect("/userProfile"))
//   .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
// })



module.exports = router;
