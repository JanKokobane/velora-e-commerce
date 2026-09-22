const { query } = require("../config/db");
const bcrypt = require("bcrypt");

const findAdminByEmail = async (email) => {
  const result = await query(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM admins
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
};

const findAdminById = async (id) => {
  const result = await query(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
      FROM admins
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
};

const getAllAdmins = async () => {
  const result = await query(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
      FROM admins
      ORDER BY id ASC
    `
  );

  return result.rows;
};

const createAdmin = async ({
  full_name,
  email,
  password,
}) => {
  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  const result = await query(
    `
      INSERT INTO admins (
        full_name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
    `,
    [
      full_name,
      email,
      passwordHash,
    ]
  );

  return result.rows[0];
};

const updateAdmin = async (
  id,
  {
    full_name,
    email,
    role,
    is_active,
  }
) => {
  const result = await query(
    `
      UPDATE admins
      SET
        full_name = $1,
        email = $2,
        role = $3,
        is_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
    `,
    [
      full_name,
      email,
      role,
      is_active,
      id,
    ]
  );

  return result.rows[0] || null;
};

const deleteAdmin = async (id) => {
  const result = await query(
    `
      DELETE FROM admins
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

module.exports = {
  findAdminByEmail,
  findAdminById,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};