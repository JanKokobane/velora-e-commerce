const express = require("express");

const {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotification,
  clearAllAdminNotifications,
} = require("../controllers/notificationController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get(
  "/",
  adminAuthMiddleware,
  getAdminNotifications
);

router.put(
  "/read-all",
  adminAuthMiddleware,
  markAllNotificationsRead
);

router.put(
  "/clear-all",
  adminAuthMiddleware,
  clearAllAdminNotifications
);

router.put(
  "/:id/read",
  adminAuthMiddleware,
  markNotificationRead
);

router.put(
  "/:id/clear",
  adminAuthMiddleware,
  clearAdminNotification
);

module.exports = router;
