const express = require("express");

const {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotification,
  clearAllAdminNotifications,
} = require("../controllers/notificationController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const userAuthMiddleware = require("../middleware/userAuthMiddleware");
const {
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  clearMyNotification,
  clearAllMyNotifications
} = require("../controllers/userNotificationController");

const router = express.Router();

router.get("/mine", userAuthMiddleware, getMyNotifications);
router.put("/mine/read-all", userAuthMiddleware, markAllMyNotificationsRead);
router.put("/mine/clear-all", userAuthMiddleware, clearAllMyNotifications);
router.put("/mine/:id/read", userAuthMiddleware, markMyNotificationRead);
router.put("/mine/:id/clear", userAuthMiddleware, clearMyNotification);

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
