const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new Schema({
    title: String,
    description: String,
    podcastId: { type: String, unique: true, require: true },
    rating: [{
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        content: Number
    }],
    comments: [{
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        content: String
    }],
    // Do we need to add the origin of the podcast? i.e. Spotify or ListenNotes?
    podcastId: {type: String, unique: true, require: true},
    origin: String
})

const Podcast = mongoose.model("Podcast", podcastSchema);
module.exports = Podcast;