const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
} = require("../services/notificationService");

const getAdminId = (req) => {
  return req.admin?.admin_id;
};

const isValidNotificationId = (id) => {
  const notificationId = Number(id);

  return Number.isInteger(notificationId) && notificationId > 0;
};

const getAdminNotifications = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        message: "Authenticated admin could not be identified.",
      });
    }

    const {
      category,
      unread,
      limit = 50,
      offset = 0,
    } = req.query;

    const notifications = await getNotifications({
      adminId,
      category,
      unread,
      limit,
      offset,
    });

    return res.status(200).json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications.",
    });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        message: "Authenticated admin could not be identified.",
      });
    }

    if (!isValidNotificationId(id)) {
      return res.status(400).json({
        message: "Invalid notification ID.",
      });
    }

    const notification = await markNotificationAsRead(
      Number(id),
      adminId
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read.",
    });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        message: "Authenticated admin could not be identified.",
      });
    }

    const result = await markAllNotificationsAsRead(adminId);

    return res.status(200).json({
      message: "All notifications marked as read.",
      ...result,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      message: "Failed to mark all notifications as read.",
    });
  }
};

const clearAdminNotification = async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        message: "Authenticated admin could not be identified.",
      });
    }

    if (!isValidNotificationId(id)) {
      return res.status(400).json({
        message: "Invalid notification ID.",
      });
    }

    const notification = await clearNotification(
      Number(id),
      adminId
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification cleared successfully.",
      notification,
    });
  } catch (error) {
    console.error("Clear notification error:", error);

    return res.status(500).json({
      message: "Failed to clear notification.",
    });
  }
};

const clearAllAdminNotifications = async (req, res) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        message: "Authenticated admin could not be identified.",
      });
    }

    const result = await clearAllNotifications(adminId);

    return res.status(200).json({
      message: "All notifications cleared successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);

    return res.status(500).json({
      message: "Failed to clear all notifications.",
    });
  }
};

module.exports = {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotification,
  clearAllAdminNotifications,
};