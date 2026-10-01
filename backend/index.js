require("dotenv").config();

const app = require("./app");

const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const returnRoutes = require("./src/routes/returnRoutes");
const driverRoutes = require("./src/routes/driverRoutes");
const { ensureDriverSchema } = require("./src/services/driverService");
const { deliverOrdersAfterDispatchWindow } = require("./src/services/orderService");
const { createNotification } = require("./src/services/notificationService");

const { connectDB } = require("./src/config/db");

const PORT = process.env.PORT || 5000;
let deliverySweepRunning = false;

const deliverExpiredOrders = async () => {
  if (deliverySweepRunning) return;
  deliverySweepRunning = true;
  try {
    const orders = await deliverOrdersAfterDispatchWindow();
    for (const order of orders) {
      try {
        await createNotification({
          type: "order_delivered",
          category: "orders",
          title: "Order Delivered",
          message: `Order #${order.order_number} was marked delivered after 2 minutes in transit.`,
          entityType: "order",
          entityId: order.id,
          actionUrl: "/admin#orders",
          isActionable: false
        });
      } catch (notificationError) {
        console.warn("Automatic delivery notification warning:", notificationError.message);
      }
    }
  } catch (error) {
    console.error("Automatic delivery sweep failed:", error.message);
  } finally {
    deliverySweepRunning = false;
  }
};

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/drivers", driverRoutes);

const startServer = async () => {
  try {
    await connectDB();
    await ensureDriverSchema();
    await deliverExpiredOrders();
    const deliverySweep = setInterval(deliverExpiredOrders, 15 * 1000);
    deliverySweep.unref?.();

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

      console.log(
        "Returns API: /api/returns"
      );

      console.log(
        "Drivers API: /api/drivers"
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
