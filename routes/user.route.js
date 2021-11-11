const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const { userModel } = require("../models/user.model");
const { postModel } = require("../models/post.model");
const { commentModel } = require("../models/comment.model");
const { JWT_SECRET_KEY } = require("../utils/constants");
const { nFormatter } = require("../utils/nFormatter");

//multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueID = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueID + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["video/mp4", "video/webm", "video/ogg"];
    console.log(file);
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      console.log("no");
      cb(null, false);
      return cb(new Error("Only mp4, .webm and ogg format allowed!"));
    }
  },
}).single("post");

//signup route
router.post(
  "/signup",
  body("username").not().isEmpty(),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 4 }),
  body("phoneNo").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ msg: null, inputErrors: errors.array() });

    const email = req.body.email.toLowerCase();
    const username = req.body.username;
    const password = req.body.password;
    const phoneNo = req.body.phoneNo;
    try {
      var result = await userModel.findOne({
        $or: [{ email }, { phoneNo }],
      });
      if (result != null) {
        if (result.email == email)
          return res
            .status(400)
            .json({ msg: "Email aready exist!", inputErrors: [] });
        else if (result.phoneNo == phoneNo)
          return res
            .status(400)
            .json({ msg: "Phone number aready exist!", inputErrors: [] });
      }

      var newUser = new userModel({
        username,
        email,
        password: bcrypt.hashSync(password, 8),
        phoneNo,
        role: "user",
      });
      newUser.save((err, result) => {
        if (err)
          return res
            .status(500)
            .json({ msg: "Cannot saved to database!", inputErrors: [] });
        res
          .status(200)
          .json({ msg: "Signup successfully!", inputErrors: [], user: result });
      });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Error on the server.", inputErrors: [] });
    }
  }
);

//login route
router.post("/login", async function (req, res) {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  try {
    const result = await userModel.findOne({ email });
    if (result == null)
      return res.status(404).json({ msg: "Email or password incorrect!" });
    var passwordIsValid = bcrypt.compareSync(password, result.password);
    if (!passwordIsValid)
      return res.status(404).json({ msg: "Email or password incorrect!" });
    const token = jwt.sign(
      { _id: result._id, role: result.role },
      JWT_SECRET_KEY,
      {
        expiresIn: 86400, // expires in 24 hours
      }
    );
    res.status(200).json({
      token: token,
      msg: "Successfull Login",
      user: result,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

//upload video
router.post(
  "/upload-post",
  body("userId").not().isEmpty(),
  body("tags").not().isEmpty(),
  body("description").isEmail().normalizeEmail(),
  (req, res) => {
    upload(req, res, function (err) {
      const userId = req.body.userId;
      const tags = req.body.tags;
      const description = req.body.description;
      const postPath = req.file.path;
      console.log(
        "tags:" + tags + " " + "description : " + description + "id" + userId
      );
      if (err instanceof multer.MulterError) {
        console.log("multer error");
        res.status(400).json({
          message: "Cannot upload please try again!",
        });
      } else if (err) {
        console.log(err.message);
        res.status(400).json({
          message: err.message,
        });
      } else {
        var newPost = new postModel({
          userId: userId,
          tags,
          description,
          postPath,
        });
        newPost.save((err, result) => {
          console.log(result);
          if (err)
            return res.status(500).json({ msg: "Cannot saved to database!" });
          res.status(200).json({ msg: "Post published successfully!" });
        });
      }
    });
  }
);

//get all videos of single user
router.get("/get-posts/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await postModel.find({ userId }).populate({
      path: "userId",
      model: "user",
      select: { username: 1, email: 1, phoneNo: 1 },
    });
    console.log(result);
    res.status(200).json({ posts: result });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

//post comment on video
router.post("/post-comment", async (req, res) => {
  const postId = req.body.postId;
  const username = req.body.username;
  const text = req.body.text;

  try {
    const newComment = new commentModel({
      username,
      text,
    });
    const result = await newComment.save();
    const savedPost = await postModel.findByIdAndUpdate(
      { _id: postId },
      { $push: { comments: result._id } },
      { new: true, upsert: true }
    );
    return res.status(200).json({ msg: "Save succesfully!", comment: result });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

//get comments of specific video
router.get("/get-comments/:postId", async (req, res) => {
  const postId = req.params.postId;
  try {
    const result = await postModel.find({ _id: postId }).populate("comments");
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//post like on a video
router.post("/post-like", async (req, res) => {
  const userId = req.body.userId;
  const postId = req.body.postId;
  try {
    const hasUserLiked = await postModel.findOne({
      _id: postId,
      likes: { $in: [userId] },
    });
    if (hasUserLiked == null) {
      const result = await postModel.findOneAndUpdate(
        {
          _id: postId,
        },
        {
          $push: { likes: userId },
        },
        { multi: true, new: true }
      );
      return res.status(200).json({ data: result });
    } else {
      const result = await postModel.findOneAndUpdate(
        {
          _id: postId,
        },
        {
          $pull: { likes: userId },
        },
        { multi: true, new: true }
      );
      return res.status(200).json({ data: result });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//get likes of a specific video
router.get("/get-likes/:postId", async (req, res) => {
  const postId = req.params.postId;
  try {
    const result = await postModel.findOne({ _id: postId }).populate({
      path: "likes",
      model: "user",
      select: { username: 1, email: 1, phoneNo: 1 },
    });
    res
      .status(200)
      .json({ data: result, totalLikes: nFormatter(result.likes.length) });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
