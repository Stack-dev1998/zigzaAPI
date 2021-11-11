const mongoose = require("mongoose");

//user an schema
var userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, trim: true, unique: true, required: true },
  password: { type: String, required: true },
  phoneNo: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
var userModel = mongoose.model("user", userSchema);

module.exports = {
  userModel,
};
