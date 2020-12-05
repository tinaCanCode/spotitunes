const Podcast = require("../models/Podcast")
const User = require("../models/User")

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
        // console.log("Response from mongo:", resp)
        return Podcast.findByIdAndUpdate(resp._id, { $push: { comments: newComment } })
          // Redirect to Detailpage
          .then(() => res.redirect(`/spotify/details/${showId}`))
          .catch(err => console.log(`Err while creating the comment in the DB: ${err}`));
      })
  }
};