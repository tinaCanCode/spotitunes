const Podcast = require("../models/Podcast")
const User = require("../models/User")
const SpotifyWebApi = require('spotify-web-api-node');
const Playlist = require('../models/Playlist');
const unirest = require('unirest');

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


module.exports = {
  addToFavorites(podcastId, userId) {

    return Podcast.exists({ podcastId: podcastId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: podcastId, origin: "spotify" })
        } else {
          return Podcast.findOne({ podcastId: podcastId })
        }
      })
      // Add ObjectId of newly created Podcast to Users favorite podcasts
      .then(podcastToAdd => {
        console.log("Podcast you want to add:", podcastToAdd)

        // Check if podcast is already part of favorite podcasts
        User.findOne({ _id: userId })
          .then(user => {
            const userFavoritePodcasts = user.favoritePodcasts

            if (userFavoritePodcasts.includes(podcastToAdd._id.toString())) {
              res.send("You can't add podcasts twice")
            } else {
              return User.findOneAndUpdate({ _id: userId }, { $push: { favoritePodcasts: podcastToAdd._id } }, { new: true })
            }

          })
          // Redirect to Homepage

          .catch(err => console.log(`Err while creating the post in the DB: ${err}`));
      })

  },

  addComment(showId, content, userId) {

    // const { showId } = ;
    // const { content } = req.body;


    const newComment = { content: content, author: userId }

    console.log(showId)
    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
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
        let userToCheckCom = userId
        let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
        console.log("=========>", hasCommented)

        if (!hasCommented) {
          return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })

        } else {
          let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
          console.log("=========>", newCommentArr)
          newCommentArr.push(newComment);
          return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })

        }
      })
  },

  ratePodcast(showId, content, userId) {

    // const { showId } = req.params;
    //const { content } = req.body;

    const newRating = { content: content, author: userId }

    //console.log(showId)
    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "spotify" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add rating to Podcast 
      .then(respond => {
        let arrayToCheck = respond.rating
        let userToCheck = userId

        let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
        console.log("=========>", hasUser)

        if (!hasUser) {
          return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })

        } else {

          let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
          console.log("=========>", newRatingArr)
          newRatingArr.push(newRating);
          return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
        }
      })


  },

  addToPlaylist(episodeId, userId) {
    return spotifyApi
      .getEpisode(episodeId, { market: "DE" })
      .then((episode) => {
        console.log("THE ID OF THE EISODEEE: " + episode.body.id)
        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { episodeID: episode.body.id, source: "spotify" } } })
      })
  },

  addToFavoritesLN(podcastId, userId) {
    return Podcast.exists({ podcastId: podcastId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: podcastId, origin: "listennotes" })
        } else {
          return Podcast.findOne({ podcastId: podcastId })
        }
      })
      // Add ObjectId of newly created Podcast to Users favorite podcasts
      .then(resp => {
        console.log("Response from mongo:", resp)
        return User.findOneAndUpdate({ _id: userId },
          { $push: { favoritePodcasts: resp._id } }, { new: true })
      })
  },

  addCommentLN(showId, content, userId) {
    const newComment = { content: content, author: userId }

    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
      .then(podcastExists => {
        if (!podcastExists) {
          return Podcast.create({ podcastId: showId, origin: "listennotes" })
        } else {
          return Podcast.findOne({ podcastId: showId })
        }
      })
      // Add ObjectId of newly created Podcast 
      .then(resp => {
        let commentsArrToCheck = resp.comments
        let userToCheckCom = userId
        let hasCommented = commentsArrToCheck.some(commentsArrToCheck => commentsArrToCheck['author'] == `${userToCheckCom}`)
        console.log("=========>", hasCommented)

        if (!hasCommented) {
          return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
        } else {
          let newCommentArr = commentsArrToCheck.filter(commentsArrToCheck => commentsArrToCheck['author'] != `${userToCheckCom}`)
          // console.log("=========>", newCommentArr)
          newCommentArr.push(newComment);
          return Podcast.findByIdAndUpdate(resp._id, { comments: newCommentArr })
        }
      })
  },

  ratePodcastLN(showId, content, userId) {

    const newRating = { content: content, author: userId }

    // check if podcast with id is already in db
    return Podcast.exists({ podcastId: showId })
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
        let userToCheck = userId

        let hasUser = arrayToCheck.some(arrayToCheck => arrayToCheck['author'] == `${userToCheck}`)
        console.log("=========>", hasUser)

        if (!hasUser) {
          return Podcast.findByIdAndUpdate(respond._id, { $push: { rating: newRating } })
        } else {

          let newRatingArr = arrayToCheck.filter(arrayToCheck => arrayToCheck['author'] != `${userToCheck}`)
          console.log("=========>", newRatingArr)
          newRatingArr.push(newRating);
          return Podcast.findByIdAndUpdate(respond._id, { rating: newRatingArr })
        }
      })
  },

  addToPlaylistLN(episodeId, userId) {
    return unirest
      .get(`https://listen-api.listennotes.com/api/v2/episodes/${episodeId}`)
      .header('X-ListenAPI-Key', 'eca50a3f8a6b4c6e96b837681be6bd3f')
      .then((episode) => {
        console.log(episode)
        return Playlist.findOneAndUpdate(
          { $and: [{ ownerID: userId }, { playlistName: "Bookmarked" }] },
          { $push: { episodes: { episodeID: episode.body.id, source: "listennotes" } } })
      })
  }

}
