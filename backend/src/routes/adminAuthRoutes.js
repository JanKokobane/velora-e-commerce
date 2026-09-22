const express = require("express");

const {
  registerAdmin,
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