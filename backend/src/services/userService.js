const pool = require('../config/db');

// =========================================================
// CREATE USER
// =========================================================

const createUser = async ({
  fullName,
  email,
  phone,
  city,
  province,
  passwordHash,
  smsEmailConsent
}) => {
  const result = await pool.query(
    `
    INSERT INTO users (
      full_name,
      email,
      phone,
      city,
      province,
      password_hash,
      sms_email_consent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      full_name,
      email,
      phone,
      city,
      province,
      sms_email_consent,
      member_tier,
      created_at,
      updated_at
    `,
    [
      fullName,
      email,
      phone,
      city,
      province,
      passwordHash,
      smsEmailConsent
    ]
  );

  return result.rows[0];
};


// =========================================================
// FIND USER BY EMAIL
// =========================================================

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      phone,
      city,
      province,
      password_hash,
      sms_email_consent,
      member_tier,
      created_at,
      updated_at
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
};


// =========================================================
// FIND USER BY ID
// =========================================================

const findUserById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      phone,
      city,
      province,
      sms_email_consent,
      member_tier,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
};


// =========================================================
// GET ALL USERS
// =========================================================

const getAllUsers = async () => {
  const result = await pool.query(
    `
    SELECT
      id,
      full_name,
      email,
      phone,
      city,
      province,
      sms_email_consent,
      member_tier,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
    `
  );

  return result.rows;
};


// =========================================================
// UPDATE USER
// =========================================================

const updateUser = async (
  id,
  {
    fullName,
    email,
    phone,
    city,
    province
  }
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET
      full_name = $1,
      email = $2,
      phone = $3,
      city = $4,
      province = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING
      id,
      full_name,
      email,
      phone,
      city,
      province,
      sms_email_consent,
      member_tier,
      created_at,
      updated_at
    `,
    [
      fullName,
      email,
      phone,
      city,
      province,
      id
    ]
  );

  return result.rows[0] || null;
};


// =========================================================
// DELETE USER
// =========================================================

const deleteUser = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    RETURNING
      id,
      full_name,
      email
    `,
    [id]
  );

  return result.rows[0] || null;
};


// =========================================================
// CHECK IF EMAIL EXISTS
// =========================================================

const emailExists = async (email, excludeUserId = null) => {
  let query;
  let values;

  if (excludeUserId) {
    query = `
      SELECT id
      FROM users
      WHERE email = $1
        AND id != $2
      LIMIT 1
    `;

    values = [email, excludeUserId];
  } else {
    query = `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
    `;

    values = [email];
  }

  const result = await pool.query(query, values);

  return result.rows.length > 0;
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  emailExists
};

