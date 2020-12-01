const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
  ownerID: { type: String, required: true },
  userName : String,
  playlistName : String,
  listenNotesEpisodes: [String],
  spotifyEpisodes: [String]
})

const Playlist = mongoose.model("Playlist", playlistSchema);
module.exports = Playlist;