const db = require('../config/db');

let schemaReady;

const ensureReturnsTable = async () => {
  if (!schemaReady) {
    schemaReady = db.query(`
      CREATE TABLE IF NOT EXISTS order_returns (
        id BIGSERIAL PRIMARY KEY,
        order_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        user_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        reason TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(24) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => db.query(`
      ALTER TABLE order_returns
      ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) NOT NULL DEFAULT 0
    `)).then(() => db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS order_returns_active_order_idx
      ON order_returns (order_number, user_id)
      WHERE status IN ('pending', 'approved')
    `)).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
};

const createReturnRequest = async (orderNumber, userId, reason) => {
  await ensureReturnsTable();
  const orderResult = await db.query(`
    SELECT id, order_number, user_id, status, full_name, email, total
    FROM orders
    WHERE order_number = $1 AND user_id = $2
    LIMIT 1
  `, [orderNumber, userId]);
  const order = orderResult.rows[0];
  if (!order) {
    const error = new Error('Order not found.');
    error.code = 'ORDER_NOT_FOUND';
    throw error;
  }
  if (String(order.status).toLowerCase() !== 'delivered') {
    const error = new Error('Only delivered orders can be returned.');
    error.code = 'ORDER_NOT_RETURNABLE';
    throw error;
  }
  const result = await db.query(`
    INSERT INTO order_returns (
      order_id, order_number, user_id, customer_name, customer_email, reason, amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, order_id, order_number, user_id, customer_name, customer_email,
      reason, amount, status, created_at, updated_at
  `, [order.id, order.order_number, userId, order.full_name, order.email, reason, order.total]);
  return result.rows[0];
};

const getReturns = async () => {
  await ensureReturnsTable();
  const result = await db.query(`
    SELECT id, order_id, order_number, user_id, customer_name, customer_email,
      reason, amount, status, created_at, updated_at
    FROM order_returns
    ORDER BY created_at DESC
  `);
  return result.rows;
};

const getReturnsForUser = async (userId) => {
  await ensureReturnsTable();
  const result = await db.query(`
    SELECT id, order_number, reason, amount, status, created_at, updated_at
    FROM order_returns
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  return result.rows;
};

const updateReturnStatus = async (returnId, status) => {
  await ensureReturnsTable();
  const result = await db.query(`
    UPDATE order_returns
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND status = 'pending'
    RETURNING id, order_id, order_number, user_id, customer_name, customer_email,
      reason, amount, status, created_at, updated_at
  `, [status, returnId]);
  return result.rows[0] || null;
};

module.exports = {
  ensureReturnsTable,
  createReturnRequest,
  getReturns,
  getReturnsForUser,
  updateReturnStatus
};
