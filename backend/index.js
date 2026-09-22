require("dotenv").config();

const app = require("./app");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Admin authentication routes
app.use("/api/admin/auth", adminAuthRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Admin auth: https://velora-e-commerce-qby7.onrender.com/api/admin/auth`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();