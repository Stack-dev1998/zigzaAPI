const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

//routes
const userRoute = require("./routes/user.route");
const adminRoute = require("./routes/admin.route");

const app = express();
// require('dotenv').config()
const port = process.env.PORT || 5000;


mongoose
  .connect("mongodb://localhost:27017/loginsignupapi")
  .then((res) => {
    console.log("=> Connected to mongodb");
  })
  .catch((err) => {
    console.log("Error :" + err);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});

app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
