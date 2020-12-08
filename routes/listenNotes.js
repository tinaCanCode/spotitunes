const express = require('express');
const router = express.Router();
const unirest = require('unirest');
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const actions = require('../modules/actions');
const { default: Axios } = require('axios');

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
  const fromListennotes = unirest
    .get(`https://listen-api.listennotes.com/api/v2/podcasts/${req.params.showId}?sort=recent_first`)
    .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')

  const fromDb = Podcast.exists({ podcastId: req.params.showId })
    .then(podcastExists => {
      if (podcastExists) {
        return Podcast.findOne({ podcastId: req.params.showId })
      } else {
        return Podcast.create({ podcastId: req.params.showId, origin: "listennotes" })
      }
    })
    .catch(err => console.log('The error while searching show occurred: ', err));

  Promise.all([fromListennotes, fromDb]).then(values => {
    // console.log(values[1]);
    let valForComments = values[1].comments;
    let valForRating = values[1].rating;

    if (req.session.currentUser) {
      userToCheckGet = req.session.currentUser._id
    } else {
      userToCheckGet = null;
    }

    let beingUser = valForRating.some(valForRating => valForRating['author'] == `${userToCheckGet}`)
    let beingCommentingUser = valForComments.some(valForComments => valForComments['author'] == `${userToCheckGet}`)


    // Converting the date

    let usersComment = valForComments.find((com) => {
      return com.author == userToCheckGet
    });
    console.log('hereeeeeeeeeee' + usersComment);

    const sumRatings = (valForRating.reduce((sum, item) => sum + item.content, 0) / valForRating.length).toFixed(1)
    console.log(sumRatings);

    if (sumRatings === "NaN") {
      sumRatingsPrint = "No ratings yet"
    } else {
      sumRatingsPrint = sumRatings
    }

    let usersRating = valForRating.find((rat) => {
      return rat.author == userToCheckGet
    })

    let lookingForDate = values[0].toJSON().body.episodes
    let firstDate = lookingForDate[0].pub_date_ms


    new Date(firstDate).toLocaleDateString("en-US")


    // var s = new Date(firstDate).toLocaleDateString("en-US")
    // console.log(s + 'new method!!!!!!!!!')

    console.log('Lookig for this date here:' + lookingForDate[0].pub_date_ms)
    // console.log('Lookig for date here:' + values[0].toJSON().body.episodes[0].pub_date_ms)
    // console.log("Response from LN: ", values[0]);
    //console.log('The received data from the API about one show: ', data.body.episodes.items[0]);
    //res.send("checked for details")


    const map1 = lookingForDate.map(x => x.pub_date_ms);
    console.log(map1 + 'wwwwwwwwtttttttffffff')

    const arrayOfDates = map1.map(element => new Date(element).toLocaleDateString("en-US"));
    console.log(arrayOfDates + '   wwwwwwwwtttttttffffff')

    console.log('The received data from the API about one show: ', values[0].toJSON().body.episodes);

    res.render("listennotes/details", {
      podcasts: values[0].toJSON().body, user: req.session.currentUser,
      ourpodcasts: values[1], ratingResults: sumRatingsPrint, beingUser: beingUser, beingCommentingUser: beingCommentingUser,
      usersRatingToPrint: usersRating, usersCommentToPrint: usersComment, arrayOfDates: arrayOfDates
    })
  })
  // .catch(err => console.log('The error while searching show occurred: ', err));
});


// Add episode to bookmarked playlist
router.post("/listennotes/details/:podcastid/:id/addtoplaylist", (req, res) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "addtoplaylist",
      podcastId: req.params.podcastid,
      episodeId: req.params.id,
      origin: "listennotes",
      message: "You need to login to bookmark episodes"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addToPlaylistLN(req.params.id, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.podcastid}`));
  }
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

router.post('listennotes/delete/:id', (req, res) => {
  Podcast.findOne({ podcastId: req.params.id })
    .then(podcast => {
      console.log("Podcast we want to delete", podcast)
      User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $pull: { favoritePodcasts: podcast._id } }, { new: true })
    })
  res.redirect("/userProfile");

})

//  *********************COMMENTS SECTION***************************

// Add new comment to a podcast
router.post('/listennotes/details/:showId/newcomment', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "comment",
      podcastId: req.params.showId,
      commentContent: req.body.content,
      origin: "listennotes",
      message: "You need to login to add a comment"
    }

    req.session.pendingRequest = requestedAction

    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.addCommentLN(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.showId}`));

  }
});

// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/listennotes/details/:showId/newrating', (req, res, next) => {

  if (!req.session.currentUser) {

    const requestedAction = {
      action: "rate",
      podcastId: req.params.showId,
      ratingContent: req.body.content,
      origin: "listennotes",
      message: "You need to login to rate a podcasts"
    }

    req.session.pendingRequest = requestedAction
    res.render("auth/login", { pendingRequest: requestedAction })

  } else {

    actions.ratePodcastLN(req.params.showId, req.body.content, req.session.currentUser._id)
      .then(() => res.redirect(`/listennotes/details/${req.params.showId}`));

  }
})

module.exports = router;