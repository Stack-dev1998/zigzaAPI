const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { userModel } = require("../models/user.model.js");
const adminAuth = require("../utils/adminAuth");
const { JWT_SECRET_KEY } = require("../utils/constants");

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
        role: "admin",
      });
      newUser.save((err, result) => {
        if (err)
          return res
            .status(500)
            .json({ msg: "Cannot saved to database!", inputErrors: [] });
        res.status(200).json({ msg: "Signup successfully!", inputErrors: [],user:result });
      });
    } catch (error) {
      return res
        .status(500)
        .json({ msg: "Error on the server.", inputErrors: [] });
    }
  }
);

//get all users route
router.get("/all-users", adminAuth, async (req, res) => {
  try {
    const result = await userModel.find({});
    return res.status(200).json({ users: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "internal server error!" });
  }
});

//update user route
router.put("/update-user",adminAuth, async (req, res) => {
  const id = req.body.id;
  const email = req.body.email.toLowerCase();
  const username = req.body.username;
  const phoneNo = req.body.phoneNo;
  try {
   const result =  await userModel.findOneAndUpdate({ _id: id }, { username, email, phoneNo });
    return res.status(200).json({ msg: "Updated user successfully!" ,updatedUser:result});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "internal server error!" });
  }
});

//delete user route
router.delete("/delete-user/:id",adminAuth, async (req, res) => {
  const id = req.params.id;
  try {
   const result =  await userModel.deleteOne({ _id: id });
     return res.status(200).json({ msg: "Deleted user successfully!",deletedUser:result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "internal server error!" });
  }
});


module.exports = router;
