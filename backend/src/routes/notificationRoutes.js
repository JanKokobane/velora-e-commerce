const express = require("express");

const {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotification,
  clearAllAdminNotifications,
} = require("../controllers/notificationController");

const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", adminAuth, getAdminNotifications);

router.put("/:id/read", adminAuth, markNotificationRead);

router.put("/read-all", adminAuth, markAllNotificationsRead);

router.put("/:id/clear", adminAuth, clearAdminNotification);

router.put("/clear-all", adminAuth, clearAllAdminNotifications);

module.exports = router;