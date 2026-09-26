const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcrypt");


const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      province,
      password,
      consent
    } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, phone and password are required."
      });
    }

    const normalizedName = String(fullName).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    const normalizedCity = city
      ? String(city).trim()
      : null;
    const normalizedProvince = province
      ? String(province).trim()
      : null;
    const plainPassword = String(password);

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters."
      });
    }

    if (normalizedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Full name cannot exceed 150 characters."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (normalizedPhone.length < 7) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number."
      });
    }

    if (normalizedPhone.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot exceed 30 characters."
      });
    }

    if (plainPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(
      plainPassword,
      12
    );

    const smsEmailConsent =
      consent === undefined
        ? true
        : Boolean(consent);

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
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        normalizedCity,
        normalizedProvince,
        passwordHash,
        smsEmailConsent
      ]
    );

    const user = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Velora client account created successfully.",
      user
    });

  } catch (error) {
    console.error("Register user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again later."
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

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
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      String(password),
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration is missing."
      });
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        role: "user"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        province: user.province,
        sms_email_consent: user.sms_email_consent,
        member_tier: user.member_tier,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error("Login user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again later."
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user could not be identified."
      });
    }

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
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve current user."
    });
  }
};

const getUsers = async (req, res) => {
  try {
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

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });

  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users."
    });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

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

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user."
    });
  }
};

const editUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      email,
      phone,
      city,
      province,
      consent
    } = req.body;

    const existingUserById = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existingUserById.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const existingUser = existingUserById.rows[0];

    const normalizedName =
      fullName !== undefined
        ? String(fullName).trim()
        : existingUser.full_name;

    const normalizedEmail =
      email !== undefined
        ? String(email).trim().toLowerCase()
        : existingUser.email;

    const normalizedPhone =
      phone !== undefined
        ? String(phone).trim()
        : existingUser.phone;

    const normalizedCity =
      city !== undefined
        ? String(city).trim()
        : existingUser.city;

    const normalizedProvince =
      province !== undefined
        ? String(province).trim()
        : existingUser.province;

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters."
      });
    }

    if (normalizedName.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Full name cannot exceed 150 characters."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (normalizedPhone.length < 7) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number."
      });
    }

    if (normalizedPhone.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot exceed 30 characters."
      });
    }

    const emailCheck = await pool.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      AND id != $2
      LIMIT 1
      `,
      [normalizedEmail, id]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Another user already uses this email."
      });
    }

    const consentValue =
      consent !== undefined
        ? Boolean(consent)
        : existingUser.sms_email_consent;

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        phone = $3,
        city = $4,
        province = $5,
        sms_email_consent = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
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
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        normalizedCity,
        normalizedProvince,
        consentValue,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user."
    });
  }
};

const removeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await pool.query(
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

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      user: existingUser.rows[0]
    });

  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete user."
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getUsers,
  getUser,
  editUser,
  removeUser
};

