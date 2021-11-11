const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  console.log(req.headers.authorization);
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ auth: false, msg: "Unauthorized: No token provided" });
  } else {
    jwt.verify(token, "my secret token", function (err, decoded) {
      if (err) {
        return res
          .status(401)
          .json({ auth: false, msg: "Unauthorized: Invalid token" });
      } else if (decoded.role != "admin") {
        return res
          .status(401)
          .json({
            auth: false,
            msg: "Unauthorized:you can't perform this operation!",
          });
      } else {
        next();
      }
    });
  }
};

module.exports = adminAuth;
