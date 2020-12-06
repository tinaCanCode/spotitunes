const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const actions = require('../modules/actions');

/* GET search page */
router.get('/listennotes', (req, res, next) => {
  res.render('listenNotes/search');
});



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
  //console.log(req.params.showId)
  const fromListennotes =unirest
  .get(`https://listen-api.listennotes.com/api/v2/podcasts/${req.params.showId}?sort=recent_first`)
    .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')

    const fromDb = Podcast.exists({ podcastId: req.params.showId })
    .then(podcastExists => {
      if (podcastExists) {
        return Podcast.findOne({ podcastId: req.params.showId })
      } else {
        return Podcast.create({ podcastId: req.params.showId })
      }
    })
    .catch(err => console.log('The error while searching show occurred: ', err));

    Promise.all([fromListennotes, fromDb]).then(values => {
      // console.log(values[1]);
      let valForComments = values[1].comments;
      let valForRating = values[1].rating;
      let userToCheckGet = req.session.currentUser._id

      let beingUser = valForRating.some(valForRating => valForRating['author'] == `${userToCheckGet}`)
      let beingCommentingUser = valForComments.some(valForComments => valForComments['author'] == `${userToCheckGet}`)
      const sumRatings = (valForRating.reduce((sum, item) => sum + item.content, 0) / valForRating.length).toFixed(1)
      console.log(sumRatings);

      console.log("Response from LN: ", values[0]);
      //console.log('The received data from the API about one show: ', data.body.episodes.items[0]);
      //res.send("checked for details")
      res.render("listennotes/details", { podcasts: values[0].toJSON().body, user: req.session.currentUser, 
      ourpodcasts: values[1], ratingResults: sumRatings, beingUser: beingUser, beingCommentingUser: beingCommentingUser })
    })
    // .catch(err => console.log('The error while searching show occurred: ', err));
})


// Add episode to bookmarked playlist
router.post("/listennotes/details/:podcastid/:id/addtoplaylist", (req, res) => {
  unirest
  .get(`https://listen-api.listennotes.com/api/v2/episodes/${req.params.id}`)
    .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
    .then((episode) => {
      console.log(episode)
      Playlist.findOneAndUpdate(
        { $and: [{ ownerID: req.session.currentUser._id }, { playlistName: "Bookmarked" }] },
        { $push: { episodes: { episodeID: episode.body.id, source: "listennotes" } } })
        //console.log(req.params)
        //console.log("THIS IS PODCAST ID :" + req.params.podcastid)
        .then(() => {
          res.redirect(`/listennotes/details/${req.params.podcastid}`)
        })
        .catch(err => console.log('The error while searching show occurred: ', err));
    })
});


// Add Listen Notes Podcasts as favorites

router.post('/listennotes/:id/addtofavorite', (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtofavorite",
      podcastId: req.params.id,
      origin: "listennotes",
      message: "You need to login to add a favorite podcast"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToFavoritesLN(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect("/userProfile"));

  }

})

//  *********************COMMENTS SECTION***************************

// Add Podcast to database
router.post('/listennotes/details/:showId/newcomment', (req, res, next) => {
  const { showId } = req.params;
  const { content } = req.body;
  const newComment = { content: content, author: req.session.currentUser._id }

  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({ podcastId: showId })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: showId, origin: "spotify" })
      } else {
        return Podcast.findOne({ podcastId: showId })
      }
    })
    // Add ObjectId of newly created Podcast 
    .then(resp => {
      let commentsArrToCheck = resp.comments
      let userToCheckCom = req.session.currentUser._id
      let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
      console.log("=========>", hasCommented)

      if (!hasCommented) {
        return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/listennotes/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      } else {
        let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
        console.log("=========>", newCommentArr)
        newCommentArr.push(newComment);
        return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })
          .then(() => res.redirect(`/listennotes/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      }
    })
});




// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/listennotes/details/:showId/newrating', (req, res, next) => {
  const { showId } = req.params;
  const { content } = req.body;
  const newRating = { content: content, author: req.session.currentUser._id }

  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({ podcastId: showId })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: showId })
      } else {
        return Podcast.findOne({ podcastId: showId })
      }
    })
    // Add rating to Podcast 
    .then(respond => {
      let arrayToCheck = respond.rating
      let userToCheck = req.session.currentUser._id

      let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
      console.log("=========>", hasUser)

      if (!hasUser) {
        return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/listennotes/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      } else {

        let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
        console.log("=========>", newRatingArr)
        newRatingArr.push(newRating);
        return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
          // Redirect to Detailpage
          .then(() => res.redirect(`/listennotes/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      }
    })
})







module.exports = router;