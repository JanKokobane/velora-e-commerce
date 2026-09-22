const express = require("express");

const {
  registerAdmin,
  loginAdmin,
  getAdmins,
  getAdmin,
  editAdmin,
  removeAdmin,
} = require("../controllers/adminAuthController");

const router = express.Router();

router.post(
  "/register",
  registerAdmin
);

router.post(
  "/login",
  loginAdmin
);

router.get(
  "/",
  getAdmins
);

router.get(
  "/:id",
  getAdmin
);

router.put(
  "/:id",
  editAdmin
);

router.delete(
  "/:id",
  removeAdmin
);

module.exports = router;