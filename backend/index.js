require("dotenv").config();

const app = require("./app");

const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

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
        "Admin API: /api/admin/auth"
      );

      console.log(
        "User API: /api/users"
      );

      console.log(
        "User registration: /api/users/register"
      );

      console.log(
        "User login: /api/users/login"
      );

      console.log(
        "Product API: /api/products"
      );

      console.log(
        "Notification API: /api/notifications"
      );

      console.log(
        "Order API: /api/orders"
      );

      console.log(
        "Payment API: /api/payments"
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
