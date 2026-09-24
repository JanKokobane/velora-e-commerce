const { query } = require("../config/db");

const getNotifications = async ({
  adminId,
  category,
  unread,
  limit = 50,
  offset = 0,
}) => {
  const values = [];
  const conditions = ["is_cleared = FALSE"];

  if (category && category !== "all" && category !== "unread") {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  if (unread === true || unread === "true" || category === "unread") {
    conditions.push("is_read = FALSE");
  }

  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const parsedOffset = Math.max(Number(offset) || 0, 0);

  values.push(parsedLimit);
  const limitIndex = values.length;

  values.push(parsedOffset);
  const offsetIndex = values.length;

  const result = await query(
    `
      SELECT
        id,
        type,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        is_cleared,
        is_actionable,
        created_at,
        read_at,
        cleared_at
      FROM admin_notifications
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
    values
  );

  return result.rows;
};

const markNotificationAsRead = async (id, adminId) => {
  const result = await query(
    `
      UPDATE admin_notifications
      SET
        is_read = TRUE,
        read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = $1
        AND is_cleared = FALSE
      RETURNING
        id,
        type,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        is_cleared,
        is_actionable,
        created_at,
        read_at,
        cleared_at
    `,
    [id]
  );

  return result.rows[0] || null;
};

const markAllNotificationsAsRead = async (adminId) => {
  const result = await query(
    `
      UPDATE admin_notifications
      SET
        is_read = TRUE,
        read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE is_cleared = FALSE
        AND is_read = FALSE
    `
  );

  return {
    updated: result.rowCount,
  };
};

const clearNotification = async (id, adminId) => {
  const result = await query(
    `
      UPDATE admin_notifications
      SET
        is_cleared = TRUE,
        cleared_at = COALESCE(cleared_at, CURRENT_TIMESTAMP)
      WHERE id = $1
        AND is_cleared = FALSE
      RETURNING
        id,
        type,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        is_cleared,
        is_actionable,
        created_at,
        read_at,
        cleared_at
    `,
    [id]
  );

  return result.rows[0] || null;
};

const clearAllNotifications = async (adminId) => {
  const result = await query(
    `
      UPDATE admin_notifications
      SET
        is_cleared = TRUE,
        cleared_at = COALESCE(cleared_at, CURRENT_TIMESTAMP)
      WHERE is_cleared = FALSE
    `
  );

  return {
    cleared: result.rowCount,
  };
};

const createNotification = async ({
  type,
  category,
  title,
  message,
  entityType = null,
  entityId = null,
  actionUrl = null,
  isActionable = false,
}) => {
  const result = await query(
    `
      INSERT INTO admin_notifications (
        type,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        is_cleared,
        is_actionable
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        FALSE,
        FALSE,
        $8
      )
      RETURNING
        id,
        type,
        category,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        is_read,
        is_cleared,
        is_actionable,
        created_at,
        read_at,
        cleared_at
    `,
    [
      type,
      category,
      title,
      message,
      entityType,
      entityId,
      actionUrl,
      isActionable,
    ]
  );

  return result.rows[0];
};

module.exports = {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
};