const express = require('express');
const router = express.Router();
const { exists } = require('../models/Podcast');
const Podcast = require('../models/Podcast');
const User = require('../models/User');
//require spotify Web api
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');


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

// /* GET search page */
// router.get('/', (req, res, next) => {
//   res.render('spotify/search');
// });

// router.get("/search-results", (req, res) => {

//   //console.log(req.query.podcast); // {podcast: "Testsearch"}

//   spotifyApi
//     //.search(req.query.podcast, ["track", "artist", "playlist", "show"])
//     .searchShows(req.query.podcast, { market: "DE", limit: 6 })
//     //.searchEpisodes(req.query.podcast)
//     .then(data => {
//       // console.log('The received data from the API about shows: ', data.body.shows.items);
//       res.render("spotify/search-result", { podcasts: data.body.shows.items })
//     })
//     .catch(err => console.log('The error while searching artists occurred: ', err));

// })


router.get("/details/:showId", (req, res) => {
  // console.log(req.params.showId)
  const fromSpotify = spotifyApi
    .getShow(req.params.showId
      , { market: "DE" }
    )
    // .then(data => {
    //   //console.log('The received data from the API about one show: ', data.body.episodes.items[0]);
    //   res.render("spotify/details", { podcasts: data.body, user: req.session.currentUser })
    // })
    // .catch(err => console.log('The error while searching show occurred: ', err));
    
    const fromOurDb = Podcast.exists({podcastId: req.params.showId})
    .then(podcastExists => {
            if (podcastExists) {
              return Podcast.findOne({podcastId: req.params.showId})
            }else{
                console.log('there is no such podcast in DB')
              }
    })
        .catch(err => console.log('The error while searching show occurred: ', err));
            
    Promise.all([fromSpotify, fromOurDb]).then(values => {
      console.log("CHECK THE VALUES :" + values);
      
      res.render("spotify/details", {podcasts:values[0].body, ourpodcasts:values[1]})
    })
})




//  *********************COMMENTS SECTION***************************



// Add Spotify Podcast to database
router.post('/details/:showId/newcomment', (req, res, next) => {

  const { showId } = req.params;
  const { content } = req.body;


  const newComment = { content: content, author: req.session.currentUser._id }


  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({podcastId: showId})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: showId,  origin: "spotify"})
    } else {
      return Podcast.findOne({podcastId: showId})
    }
  })
  // Add ObjectId of newly created Podcast 
  .then(resp => {
    // console.log("Response from mongo:", resp)
    return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment} })
  // Redirect to Detailpage
  .then(() => res.redirect(`/spotify/details/${showId}`))
  .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
})
});



// +++++++++++++++++++++++++RATING SECTION++++++++++++++++++++++++++++

router.post('/details/:showId/newrating', (req, res, next) => {

  const { showId } = req.params;
  const { content } = req.body;


  const newRating = { content : content, author: req.session.currentUser._id }


  console.log(showId)
  // check if podcast with id is already in db
  Podcast.exists({podcastId: showId})
  .then(podcastExists => {
    if (!podcastExists) {
      return Podcast.create({podcastId: showId})
    } else {
      return Podcast.findOne({podcastId: showId})
    }
  })
  // Add rating to Podcast 
  .then(respond => {
    //console.log("Response from mongo:", respond)
    return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating} })
  // Redirect to Detailpage
  .then(() => res.redirect(`/spotify/details/${showId}`))
  .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
})
});

// ********************************************************

// Add Spotify Podcasts as favorites

router.post('/:id/addtofavorite', (req, res) => {
  // create new object in database
  // push this ID to user "favorites" array
  //console.log("THE PARAMS: " + req.params.id)

  Podcast.exists({ podcastId: req.params.id })
    .then(podcastExists => {
      if (!podcastExists) {
        return Podcast.create({ podcastId: req.params.id, origin: "spotify" })
      } else {
        return Podcast.findOne({ podcastId: req.params.id })
      }
    })
    // Add ObjectId of newly created Podcast to Users favorite podcasts
    .then(resp => {
      //console.log("Podcast you want to add:", resp)
      // Check if podcast is already part of favorite podcasts



      return User.findOneAndUpdate({ _id: req.session.currentUser._id }, { $push: { favoritePodcasts: resp._id } }, { new: true })
    })
    // Redirect to Homepage
    .then(() => res.redirect("/userProfile"))
    .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
})

//addtoplaylist
router.post("/details/:podcastid/:id/addtoplaylist", (req, res) => {
  Playlist.findOneAndUpdate(
          {$and: [{ownerID : req.session.currentUser._id}, {playlistName : "Bookmarked"} ] },
          {$push: {spotifyEpisodes : req.params.id }})
   .then(() => {
    res.redirect(`/spotify/details/${req.params.podcastid}`)
  })
  .catch(err => console.log('The error while searching show occurred: ', err));
});

module.exports = router;
