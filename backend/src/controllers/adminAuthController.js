const {
  createAdmin,
  findAdminByEmail,
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

    const normalizedName = String(full_name).trim();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

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

module.exports = {
  registerAdmin,
};