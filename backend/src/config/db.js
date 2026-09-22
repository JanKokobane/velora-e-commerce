const { Pool } = require("pg");

require("dotenv").config();

let pool;

const hasDbConfig = Boolean(
  process.env.DB_HOST || process.env.DATABASE_URL
);

if (hasDbConfig) {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
        ? Number(process.env.DB_PORT)
        : 5432,
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
    });
  } catch (e) {
    console.warn(
      "[AI Studio] Error instantiating pg Pool:",
      e.message
    );
  }
}

if (!pool) {
  console.warn(
    "[AI Studio] Database not configured — mock DB active"
  );

  pool = {
    query: async () => ({ rows: [] }),

    connect: async () => ({
      query: async () => ({
        rows: [
          {
            now: new Date().toISOString(),
          },
        ],
      }),

      release: () => {},
    }),
  };
}

/**
 * Execute a PostgreSQL query
 */
const query = async (text, params) => {
  return pool.query(text, params);
};

/**
 * Test database connection
 */
const connectDB = async () => {
  try {
    if (!hasDbConfig) {
      console.log(
        "[AI Studio] No DB credentials provided. Mock database active."
      );

      return;
    }

    const client = await pool.connect();

    console.log("Database Connected");

    const result = await client.query(
      "SELECT NOW()"
    );

    console.log(result.rows[0]);

    client.release();
  } catch (error) {
    console.warn(
      "[AI Studio] Database connection failed:",
      error.message
    );

    console.warn(
      "[AI Studio] Server will continue with mock DB active."
    );
  }
};

module.exports = {
  pool,
  query,
  connectDB,
};