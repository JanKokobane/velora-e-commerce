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
    const {
      depletedProducts = [],
      ...orderResponse
    } = order;

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

    for (const product of depletedProducts) {
      try {
        await createNotification({
          type: 'product_out_of_stock',
          category: 'inventory',
          title: 'Product Out of Stock',
          message: `${product.title} has sold out. Restock it to make it available in the storefront again.`,
          entityType: 'product',
          entityId: product.id,
          actionUrl: '/admin#inventory',
          isActionable: true
        });
      } catch (notificationError) {
        console.warn(
          'Out-of-stock notification warning:',
          notificationError.message
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: orderResponse
    });
  } catch (error) {
    console.error(
      'Create order error:',
      error
    );

    if (error.code === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

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

const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const orderNumber = req.params.orderNumber;

    if (req.user?.role !== 'user' || !userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the order owner can cancel this order.'
      });
    }

    const order = await orderService.cancelOrderForUser(orderNumber, userId);

    try {
      await createNotification({
        type: 'order_cancelled',
        category: 'orders',
        title: 'Order Cancellation Requested',
        message: `Order #${order.order_number} was cancelled by its customer.`,
        entityType: 'order',
        entityId: order.id,
        actionUrl: '/admin#orders',
        isActionable: true
      });
    } catch (notificationError) {
      console.warn('Order cancellation notification warning:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      order
    });
  } catch (error) {
    const status = error.code === 'ORDER_NOT_FOUND'
      ? 404
      : error.code === 'ORDER_NOT_CANCELLABLE'
        ? 409
        : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Unable to cancel order.'
    });
  }
};

const deleteOrder = async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({
      success: false,
      message: 'Administrator access is required to delete orders.'
    });
  }

  try {
    const order = await orderService.deleteOrder(req.params.orderNumber);
    try {
      await createNotification({
        type: 'order_deleted',
        category: 'orders',
        title: 'Order Deleted',
        message: `Order #${order.order_number} and its associated payment were deleted by an administrator.`,
        entityType: 'order',
        entityId: order.id,
        actionUrl: '/admin#orders',
        isActionable: false
      });
    } catch (notificationError) {
      console.warn('Order deletion notification warning:', notificationError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order and associated payment records deleted successfully.',
      order
    });
  } catch (error) {
    const status = error.code === 'ORDER_NOT_FOUND' ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Unable to delete order.'
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
  getAllOrders,
  cancelMyOrder,
  deleteOrder
};