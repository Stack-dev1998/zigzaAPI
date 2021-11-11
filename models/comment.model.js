const mongoose = require("mongoose");

//post schema
var commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
var commentModel = mongoose.model("comment", commentSchema);

module.exports = {
  commentModel,
};
