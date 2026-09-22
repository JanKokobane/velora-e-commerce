const jwt = require("jsonwebtoken");

const {
  createAdmin,
  findAdminByEmail,
  findAdminById,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
} = require("../services/adminService");

const registerAdmin = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message:
          "Full name, email and password are required.",
      });
    }

    const normalizedName =
      String(full_name).trim();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const plainPassword = String(password);

    if (normalizedName.length < 2) {
      return res.status(400).json({
        message:
          "Full name must be at least 2 characters.",
      });
    }

    if (normalizedName.length > 150) {
      return res.status(400).json({
        message:
          "Full name cannot exceed 150 characters.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message:
          "Please provide a valid email address.",
      });
    }

    if (plainPassword.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const existingAdmin =
      await findAdminByEmail(normalizedEmail);

    if (existingAdmin) {
      return res.status(409).json({
        message:
          "An admin account with this email already exists.",
      });
    }

    const admin = await createAdmin({
      full_name: normalizedName,
      email: normalizedEmail,
      password: plainPassword,
    });

    return res.status(201).json({
      message:
        "Admin account created successfully.",
      admin,
    });
  } catch (error) {
    console.error(
      "Admin registration error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create admin account.",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const admin =
      await findAdminByEmail(normalizedEmail);

    if (!admin) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        message:
          "This admin account is inactive.",
      });
    }

    const passwordMatches =
      await require("bcrypt").compare(
        String(password),
        admin.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        admin_id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        is_active: admin.is_active,
      },
    });
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to login admin.",
    });
  }
};

const getAdmins = async (req, res) => {
  try {
    const admins = await getAllAdmins();

    return res.status(200).json({
      admins,
    });
  } catch (error) {
    console.error(
      "Get admins error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch admins.",
    });
  }
};

const getAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await findAdminById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found.",
      });
    }

    return res.status(200).json({
      admin,
    });
  } catch (error) {
    console.error(
      "Get admin error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch admin.",
    });
  }
};

const editAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      full_name,
      email,
      role,
      is_active,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !role ||
      typeof is_active !== "boolean"
    ) {
      return res.status(400).json({
        message:
          "Full name, email, role and is_active are required.",
      });
    }

    const normalizedName =
      String(full_name).trim();

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message:
          "Please provide a valid email address.",
      });
    }

    if (normalizedName.length < 2) {
      return res.status(400).json({
        message:
          "Full name must be at least 2 characters.",
      });
    }

    const existingAdmin =
      await findAdminByEmail(normalizedEmail);

    if (
      existingAdmin &&
      String(existingAdmin.id) !== String(id)
    ) {
      return res.status(409).json({
        message:
          "Another admin already uses this email.",
      });
    }

    const existingAdminById =
      await findAdminById(id);

    if (!existingAdminById) {
      return res.status(404).json({
        message: "Admin not found.",
      });
    }

    const admin = await updateAdmin(
      id,
      {
        full_name: normalizedName,
        email: normalizedEmail,
        role: String(role).trim(),
        is_active,
      }
    );

    return res.status(200).json({
      message: "Admin updated successfully.",
      admin,
    });
  } catch (error) {
    console.error(
      "Update admin error:",
      error
    );

    return res.status(500).json({
      message: "Failed to update admin.",
    });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await findAdminById(id);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found.",
      });
    }

    await deleteAdmin(id);

    return res.status(200).json({
      message: "Admin deleted successfully.",
      admin,
    });
  } catch (error) {
    console.error(
      "Delete admin error:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete admin.",
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdmins,
  getAdmin,
  editAdmin,
  removeAdmin,
};