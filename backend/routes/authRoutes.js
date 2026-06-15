const express = require("express");
const router = express.Router();

const {
  login,
  register
} = require("../controllers/authController");

router.get("/test", (req, res) => {
  res.json({
    message: "Auth Route Working"
  });
});

router.post("/login", login);

router.post("/register", register);

module.exports = router;