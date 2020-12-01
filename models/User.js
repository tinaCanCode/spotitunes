const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema ({
  username: {type: String, unique: true, required: true,  trim: true},
  password: {type: String, required: true},
  email: { type: String, required:[true, 'Email is required.'], match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  unique:true, trim: true, lowercase: true},
  // authToken: { type: String, required:true, unique:true },
  // isAuthenticated: { type: Boolean, required:true },
  favoritePodcasts: [{ type: Schema.Types.ObjectId, ref: 'Podcast' }],
 })

const User = mongoose.model("User", userSchema);
module.exports = User;