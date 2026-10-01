const db = require('../config/db');
const { ensureReturnsTable } = require('./returnService');

let schemaReady;

const ensureUserNotificationsTable = async () => {
  if (!schemaReady) {
    schemaReady = ensureReturnsTable().then(() => db.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        type VARCHAR(80) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL DEFAULT '',
        entity_type VARCHAR(50),
        entity_id TEXT,
        order_number TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMPTZ,
        cleared_at TIMESTAMPTZ
      )
    `)).then(() => db.query(`
      CREATE INDEX IF NOT EXISTS user_notifications_feed_idx
      ON user_notifications (user_id, created_at DESC)
      WHERE is_cleared = FALSE
    `)).then(() => db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_event_idx
      ON user_notifications (user_id, type, entity_type, entity_id)
      WHERE entity_id IS NOT NULL
    `)).then(() => db.query(`
      INSERT INTO user_notifications (
        user_id, type, title, message, entity_type, entity_id, order_number, created_at
      )
      SELECT
        r.user_id,
        'return_' || r.status,
        CASE r.status
          WHEN 'pending' THEN 'Return request received'
          WHEN 'approved' THEN 'Return approved'
          WHEN 'refunded' THEN 'Return refunded'
          ELSE 'Return request update'
        END,
        CASE r.status
          WHEN 'pending' THEN 'Reason: ' || r.reason
          WHEN 'approved' THEN 'Your return was approved. Reason: ' || r.reason
          WHEN 'refunded' THEN 'Reason: ' || r.reason
          ELSE 'Your return request was updated. Reason: ' || r.reason
        END,
        'return',
        r.id::text,
        r.order_number,
        CASE WHEN r.status = 'pending' THEN r.created_at ELSE r.updated_at END
      FROM order_returns r
      WHERE r.status IN ('pending', 'approved', 'refunded', 'rejected')
      ON CONFLICT DO NOTHING
    `)).catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
};

const createUserNotification = async ({
  userId,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  orderNumber = null,
  createdAt = null
}) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    INSERT INTO user_notifications (
      user_id, type, title, message, entity_type, entity_id, order_number, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP))
    ON CONFLICT DO NOTHING
    RETURNING id, user_id, type, title, message, entity_type, entity_id,
      order_number, is_read, is_cleared, created_at, read_at, cleared_at
  `, [String(userId), type, title, message, entityType, entityId == null ? null : String(entityId), orderNumber, createdAt]);
  return result.rows[0] || null;
};

const getUserNotifications = async (userId) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    SELECT id, user_id, type, title, message, entity_type, entity_id,
      order_number, is_read, is_cleared, created_at, read_at, cleared_at
    FROM user_notifications
    WHERE user_id = $1 AND is_cleared = FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT 100
  `, [String(userId)]);
  return result.rows;
};

const markUserNotificationRead = async (id, userId) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    UPDATE user_notifications
    SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE id = $1 AND user_id = $2 AND is_cleared = FALSE
    RETURNING id, user_id, type, title, message, entity_type, entity_id,
      order_number, is_read, is_cleared, created_at, read_at, cleared_at
  `, [id, String(userId)]);
  return result.rows[0] || null;
};

const markAllUserNotificationsRead = async (userId) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    UPDATE user_notifications
    SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE user_id = $1 AND is_cleared = FALSE AND is_read = FALSE
  `, [String(userId)]);
  return { updated: result.rowCount };
};

const clearUserNotification = async (id, userId) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    UPDATE user_notifications
    SET is_cleared = TRUE, cleared_at = COALESCE(cleared_at, CURRENT_TIMESTAMP)
    WHERE id = $1 AND user_id = $2 AND is_cleared = FALSE
    RETURNING id
  `, [id, String(userId)]);
  return result.rows[0] || null;
};

const clearAllUserNotifications = async (userId) => {
  await ensureUserNotificationsTable();
  const result = await db.query(`
    UPDATE user_notifications
    SET is_cleared = TRUE, cleared_at = COALESCE(cleared_at, CURRENT_TIMESTAMP)
    WHERE user_id = $1 AND is_cleared = FALSE
  `, [String(userId)]);
  return { cleared: result.rowCount };
};

module.exports = {
  createUserNotification,
  getUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  clearUserNotification,
  clearAllUserNotifications
};