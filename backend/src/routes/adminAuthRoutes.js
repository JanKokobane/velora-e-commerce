const express = require("express");

const {
  registerAdmin,
} = require("../controllers/adminAuthController");

const router = express.Router();

router.post(
  "/register",
  registerAdmin
);

module.exports = router;