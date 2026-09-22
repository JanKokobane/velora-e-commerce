require("dotenv").config();

const app = require("./app");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

app.use("/api/admin/auth", adminAuthRoutes);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Admin auth: /api/admin/auth`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();