require("dotenv").config();

const app = require("./app");

const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const productRoutes = require("./src/routes/productRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);

const startServer = async () => {
  try {
    await connectDB();

    console.log(
      "JWT_SECRET configured:",
      !!process.env.JWT_SECRET
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        "Admin registration: /api/admin/auth/register"
      );

      console.log(
        "Product API: /api/products"
      );

      console.log(
        "Notification API: /api/notifications"
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();