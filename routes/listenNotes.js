const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');

// /* GET search page */
// router.get('/listennotes', (req, res, next) => {
//   res.render('listenNotes/search');
// });



// router.get('/listennotes/search-results', (req, res) => {
//   //console.log("HERE IS THE QUERY: " + req.query.podcast)
//   unirest.get(`https://listen-api.listennotes.com/api/v2/search?q=${req.query.podcast}&type=podcast`)
//     .header('X-ListenAPI-Key', '92deae50310140ab877e8f1d4e4c8fcd')
//     .then((response) => {
//       //console.log("the response: " + response.toJSON().body.results)
//       response.toJSON()
//       res.render('listenNotes/search-results-ln', { searchResults: response.toJSON().body.results })
//     })
// })

// Listen Notes DETAILS page

router.get("/listennotes/details/:showId", (req, res) => {
  console.log(req.params.showId)
  unirest.get(`https://listen-api.listennotes.com/api/v2/podcasts/${req.params.showId}?sort=recent_first`)
    .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
    .then(response => {
      console.log("Response from LN: ", response.toJSON().body);
      //console.log('The received data from the API about one show: ', data.body.episodes.items[0]);
      //res.send("checked for details")
      res.render("listennotes/details", { podcasts: response.toJSON().body })
    })
    .catch(err => console.log('The error while searching show occurred: ', err));
})





// Add Listen Notes Podcast to database
router.post('/listennotes/details/:showId/newcomment', (req, res, next) => {

  const { showId } = req.params;
  const { content } = req.body;


  const newComment = { content: content, author: req.session.currentUser._id }


  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({podcastId: showId})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: showId, origin: "listennotes"})
    } else {
      return Podcast.findOne({podcastId: showId})
    }
  })
  // Add ObjectId of newly created Podcast 
  .then(respond => {
    console.log("Response from mongo:", respond)
    return Podcast.findByIdAndUpdate(respond._id, { $push: { comments: newComment} })
  // Redirect to Homepage
  .then(() => res.redirect(`/listennotes/details/${showId}`))
  .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
})
});


// **************************************************************************




// Add Listen Notes Podcasts as favorites

router.post('/listennotes/:id/addtofavorite', (req, res) => {
  // create new object in database
  // push this ID to user "favorites" array
  console.log("THE PARAMS: " + req.params.id)
  Podcast.exists({ podcastId: req.params.id })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: req.params.id , origin: "listennotes"})
      } else {
        return Podcast.findOne({ podcastId: req.params.id })
      }
    })
    // Add ObjectId of newly created Podcast to Users favorite podcasts
    .then(resp => {
      console.log("Response from mongo:", resp)
      return User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $push: { favoritePodcasts: resp._id } }, { new: true })
    })
    // Redirect to Homepage
    .then(() => res.redirect("/userProfile"))
    .catch(err => console.log(`Err while creating the post in the DB: ${err}`))
})





module.exports = router;