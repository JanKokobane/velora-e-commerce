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

const createAdmin = async ({
  full_name,
  email,
  password,
}) => {
  
  const passwordHash = await bcrypt.hash(password, 12);

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

module.exports = {
  findAdminByEmail,
  createAdmin,
};