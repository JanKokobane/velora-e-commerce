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
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ
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

module.exports = { ensureDriverSchema, getDrivers, createDriver };
