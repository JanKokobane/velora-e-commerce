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
    `)).then(() => db.query(`
      DO $migration$
      DECLARE
        status_constraint RECORD;
      BEGIN
        FOR status_constraint IN
          SELECT conrelid::regclass AS table_name,
            conname AS constraint_name,
            pg_get_expr(conbin, conrelid) AS expression
          FROM pg_constraint
          WHERE conrelid IN (to_regclass('orders'), to_regclass('payments'))
            AND contype = 'c'
            AND LOWER(pg_get_expr(conbin, conrelid)) LIKE '%payment_status%'
        LOOP
          IF POSITION('refunded' IN LOWER(status_constraint.expression)) = 0 THEN
            EXECUTE FORMAT(
              'ALTER TABLE %s DROP CONSTRAINT %I',
              status_constraint.table_name,
              status_constraint.constraint_name
            );
            EXECUTE FORMAT(
              'ALTER TABLE %s ADD CONSTRAINT %I CHECK ((payment_status = ''refunded'') OR (%s))',
              status_constraint.table_name,
              status_constraint.constraint_name,
              status_constraint.expression
            );
          END IF;
        END LOOP;
      END;
      $migration$
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
  const existingReturn = await db.query(`
    SELECT id
    FROM order_returns
    WHERE order_number = $1 AND user_id = $2
      AND status IN ('pending', 'approved', 'refunded')
    LIMIT 1
  `, [orderNumber, userId]);
  if (existingReturn.rows.length > 0) {
    const error = new Error('A return request already exists for this delivered order.');
    error.code = 'RETURN_ALREADY_EXISTS';
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

const refundReturn = async (returnId) => {
  await ensureReturnsTable();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const returnResult = await client.query(`
      SELECT id, order_id, order_number, status
      FROM order_returns
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `, [returnId]);
    const returnRequest = returnResult.rows[0];
    if (!returnRequest) {
      const error = new Error('Return request not found.');
      error.code = 'RETURN_NOT_FOUND';
      throw error;
    }
    if (String(returnRequest.status).toLowerCase() !== 'approved') {
      const error = new Error('Approve the return request before issuing its refund.');
      error.code = 'RETURN_NOT_APPROVED';
      throw error;
    }

    const orderResult = await client.query(`
      SELECT id, payment_status
      FROM orders
      WHERE id::text = $1
      LIMIT 1
      FOR UPDATE
    `, [String(returnRequest.order_id)]);
    const order = orderResult.rows[0];
    if (!order || String(order.payment_status).toLowerCase() !== 'paid') {
      const error = new Error('The order does not have a refundable paid balance.');
      error.code = 'PAYMENT_NOT_REFUNDABLE';
      throw error;
    }

    const paymentResult = await client.query(`
      SELECT id, payment_status
      FROM payments
      WHERE order_id::text = $1
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `, [String(returnRequest.order_id)]);
    const payment = paymentResult.rows[0];
    if (!payment || String(payment.payment_status).toLowerCase() !== 'paid') {
      const error = new Error('A paid transaction for this order could not be found.');
      error.code = 'PAYMENT_NOT_REFUNDABLE';
      throw error;
    }

    await client.query(`
      UPDATE payments
      SET payment_status = 'refunded',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [payment.id]);
    await client.query(`
      UPDATE orders
      SET payment_status = 'refunded',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [order.id]);
    const updatedReturnResult = await client.query(`
      UPDATE order_returns
      SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, order_id, order_number, user_id, customer_name, customer_email,
        reason, amount, status, created_at, updated_at
    `, [returnId]);

    await client.query('COMMIT');
    return updatedReturnResult.rows[0];
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  ensureReturnsTable,
  createReturnRequest,
  getReturns,
  getReturnsForUser,
  updateReturnStatus,
  refundReturn
};
