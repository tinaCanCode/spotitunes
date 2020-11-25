const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new Schema ({
    title: String,
    description: String,
    podcastId: {type: String, unique: true, require: true}
    // Do we need to add the origin of the podcast? i.e. Spotify or ListenNotes?
})

const Podcast = mongoose.model("Podcast", podcastSchema);
module.exports = Podcast;