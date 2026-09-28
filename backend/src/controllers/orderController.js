const orderService = require('../services/orderService');
const { createNotification } = require('../services/notificationService');

const isAdminRequest = (req) => {
  return Boolean(
    req.user?.role === 'admin' ||
    req.user?.admin_id ||
    req.admin
  );
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user could not be identified.'
      });
    }

    const {
      items,
      shipping,
      deliveryMethod = 'express'
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one order item is required.'
      });
    }

    if (!shipping || typeof shipping !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Shipping information is required.'
      });
    }

    const requiredShippingFields = [
      'fullName',
      'email',
      'phone',
      'street',
      'city',
      'postalCode',
      'province'
    ];

    for (const field of requiredShippingFields) {
      if (!String(shipping[field] || '').trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`
        });
      }
    }

    const order = await orderService.createOrder({
      userId,
      items,
      shipping,
      deliveryMethod
    });

    try {
      const orderTotal = Number(
        order?.total || 0
      ).toLocaleString('en-ZA', {
        minimumFractionDigits: 2
      });

      await createNotification({
        type: 'order_created',
        category: 'orders',
        title: 'New Order Placed',
        message: `Order #${order?.orderNumber || order?.id} placed by ${shipping.fullName} for R ${orderTotal}.`,
        entityType: 'order',
        entityId: order?.id || null,
        actionUrl: '/admin#orders',
        isActionable: true
      });
    } catch (notifErr) {
      console.warn(
        'Order notification warning:',
        notifErr.message
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order
    });
  } catch (error) {
    console.error(
      'Create order error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to create order.'
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    if (isAdminRequest(req)) {
      const orders =
        await orderService.getAllOrders();

      return res.status(200).json({
        success: true,
        count: orders.length,
        orders
      });
    }

    const userId =
      req.user?.user_id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user could not be identified.'
      });
    }

    const orders =
      await orderService.getOrdersByUserId(
        userId
      );

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error(
      'Get user orders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve orders.'
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        message: 'Administrator access is required.'
      });
    }

    const orders =
      await orderService.getAllOrders();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error(
      'Get all orders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve orders.'
    });
  }
};

const getMyOrder = async (req, res) => {
  try {
    const { orderNumber } =
      req.params;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required.'
      });
    }

    if (isAdminRequest(req)) {
      const orders =
        await orderService.getAllOrders();

      const order =
        orders.find(
          item =>
            String(
              item.orderNumber || ''
            ).toLowerCase() ===
            String(orderNumber).toLowerCase()
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found.'
        });
      }

      return res.status(200).json({
        success: true,
        order
      });
    }

    const userId =
      req.user?.user_id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user could not be identified.'
      });
    }

    const order =
      await orderService.getOrderByNumberForUser(
        orderNumber,
        userId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error(
      'Get order error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve order.'
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrder,
  getAllOrders
};