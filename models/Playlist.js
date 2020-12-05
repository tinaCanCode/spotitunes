const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
  ownerID: { type: String, required: true },
  userName : String,
  playlistName : String,
  episodes: [{
    id : String,
    title : String,
    link : String,
    source : String
  }],
})

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;