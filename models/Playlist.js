const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
  ownerID: { type: String, required: true },
  userName : String,
  playlistName : String,
  listenNotesEpisodes: [{
    id : String,
    title : String,
    link : String
  }],
  spotifyEpisodes: [{
    id : String,
    title : String,
    link : String
  }]
})

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;