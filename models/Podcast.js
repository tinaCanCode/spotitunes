const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new Schema ({
    title: String,
    description: String
})

const Podcast = mongoose.model("Podcast", podcastSchema);
module.exports = Podcast;