const express = require("express");

const {
  registerAdmin,
  loginAdmin,
  getCurrentAdmin,
  getAdmins,
  getAdmin,
  editAdmin,
  removeAdmin,
} = require("../controllers/adminAuthController");

const adminAuthMiddleware = require(
  "../middleware/adminAuthMiddleware"
);

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
  "/me",
  adminAuthMiddleware,
  getCurrentAdmin
);

router.get(
  "/",
  adminAuthMiddleware,
  getAdmins
);

router.get(
  "/:id",
  adminAuthMiddleware,
  getAdmin
);

router.put(
  "/:id",
  adminAuthMiddleware,
  editAdmin
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  removeAdmin
);

module.exports = router;