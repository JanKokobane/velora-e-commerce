const userNotificationService = require('../services/userNotificationService');

const getUserId = req => req.user?.role === 'user' ? req.user.user_id : null;
const isValidId = id => /^\d+$/.test(String(id || '')) && Number(id) > 0;

const getMyNotifications = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(403).json({ success: false, message: 'User access is required.' });
  try {
    const notifications = await userNotificationService.getUserNotifications(userId);
    return res.status(200).json({ success: true, notifications, unreadCount: notifications.filter(item => !item.is_read).length });
  } catch (error) {
    console.error('Get user notifications error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve your notifications.' });
  }
};

const markMyNotificationRead = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(403).json({ success: false, message: 'User access is required.' });
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
  try {
    const notification = await userNotificationService.markUserNotificationRead(Number(req.params.id), userId);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Mark user notification read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to mark notification as read.' });
  }
};

const markAllMyNotificationsRead = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(403).json({ success: false, message: 'User access is required.' });
  try {
    const result = await userNotificationService.markAllUserNotificationsRead(userId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Mark all user notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Unable to mark notifications as read.' });
  }
};

const clearMyNotification = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(403).json({ success: false, message: 'User access is required.' });
  if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
  try {
    const notification = await userNotificationService.clearUserNotification(Number(req.params.id), userId);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Clear user notification error:', error);
    return res.status(500).json({ success: false, message: 'Unable to clear notification.' });
  }
};

const clearAllMyNotifications = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(403).json({ success: false, message: 'User access is required.' });
  try {
    const result = await userNotificationService.clearAllUserNotifications(userId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Clear all user notifications error:', error);
    return res.status(500).json({ success: false, message: 'Unable to clear notifications.' });
  }
};

module.exports = {
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  clearMyNotification,
  clearAllMyNotifications
};