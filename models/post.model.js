const mongoose = require("mongoose");

//post schema
var postSchema = new mongoose.Schema({
  tags: { type: String, required: true },
  description: { type: String, required: true },
  postPath: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  createdAt: { type: Date, default: Date.now },
});
var postModel = mongoose.model("post", postSchema);

module.exports = {
  postModel,
};
