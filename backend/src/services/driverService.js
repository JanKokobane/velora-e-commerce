const db = require('../config/db');

let schemaReady;

const ensureDriverSchema = async () => {
  if (!schemaReady) {
    schemaReady = db.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id BIGSERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(254) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        province VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() => db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS drivers_email_lower_idx
      ON drivers (LOWER(email))
    `)).then(() => db.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS driver_id BIGINT REFERENCES drivers(id) ON DELETE SET NULL
    `)).then(() => db.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ
    `)).then(() => db.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ
    `)).then(() => db.query(`
      DO $migration$
      DECLARE
        status_check TEXT;
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('orders_status_check_migration'));

        SELECT pg_get_expr(conbin, conrelid)
        INTO status_check
        FROM pg_constraint
        WHERE conrelid = 'orders'::regclass
          AND conname = 'orders_status_check'
          AND contype = 'c';

        IF status_check IS NOT NULL AND POSITION('accepted' IN LOWER(status_check)) = 0 THEN
          ALTER TABLE orders DROP CONSTRAINT orders_status_check;
          EXECUTE FORMAT(
            'ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK ((status = ''accepted'') OR (%s))',
            status_check
          );
        END IF;
      END;
      $migration$
    `)).then(() => db.query(`
      UPDATE orders
      SET driver_assigned_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
      WHERE status = 'in-transit'
        AND driver_id IS NOT NULL
        AND driver_assigned_at IS NULL
    `)).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
};

const getDrivers = async () => {
  await ensureDriverSchema();
  const result = await db.query(`
    SELECT id, full_name, email, phone, province, created_at, updated_at
    FROM drivers
    ORDER BY full_name ASC
  `);
  return result.rows;
};

const createDriver = async ({ fullName, email, phone, province }) => {
  await ensureDriverSchema();
  const result = await db.query(`
    INSERT INTO drivers (full_name, email, phone, province)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, phone, province, created_at, updated_at
  `, [fullName, email, phone, province]);
  return result.rows[0];
};

const updateDriver = async (id, { fullName, email, phone, province }) => {
  await ensureDriverSchema();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const currentResult = await client.query(`
      SELECT id, province
      FROM drivers
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `, [id]);
    const current = currentResult.rows[0];
    if (!current) {
      await client.query('ROLLBACK');
      return null;
    }

    if (String(current.province).toLowerCase() !== province.toLowerCase()) {
      const assignmentResult = await client.query(`
        SELECT 1
        FROM orders
        WHERE driver_id = $1
          AND status = 'in-transit'
          AND LOWER(province) <> LOWER($2)
        LIMIT 1
      `, [id, province]);
      if (assignmentResult.rows.length > 0) {
        const error = new Error('This driver has active deliveries outside the selected province. Complete or reassign them before changing province.');
        error.code = 'DRIVER_ACTIVE_PROVINCE_MISMATCH';
        throw error;
      }
    }

    const result = await client.query(`
      UPDATE drivers
      SET full_name = $1,
          email = $2,
          phone = $3,
          province = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, full_name, email, phone, province, created_at, updated_at
    `, [fullName, email, phone, province, id]);
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

const deleteDriver = async (id) => {
  await ensureDriverSchema();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const driverResult = await client.query(`
      SELECT id, full_name
      FROM drivers
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `, [id]);
    const driver = driverResult.rows[0];
    if (!driver) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(`
      UPDATE orders
      SET driver_id = NULL,
          status = CASE WHEN status = 'in-transit' THEN 'accepted' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE driver_id = $1
    `, [id]);
    const result = await client.query(`
      DELETE FROM drivers
      WHERE id = $1
      RETURNING id, full_name
    `, [id]);
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { ensureDriverSchema, getDrivers, createDriver, updateDriver, deleteDriver };
