const paymentService = require('../services/paymentService');


/**
 * Start a payment for an order
 *
 * POST /api/payments
 *
 * Requires:
 * Authorization: Bearer <JWT>
 */
const createPayment = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user could not be identified.'
      });
    }

    const {
      orderNumber,
      paymentMethod
    } = req.body;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required.'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required.'
      });
    }

    const allowedPaymentMethods = [
      'card',
      'eft',
      'snapscan',
      'zapper',
      'cod'
    ];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method.'
      });
    }

    const payment = await paymentService.createPayment({
      userId,
      orderNumber,
      paymentMethod
    });

    return res.status(201).json({
      success: true,
      message: 'Payment initiated successfully.',
      payment
    });
  } catch (error) {
    console.error('Create payment error:', error);

    if (error.code === 'ORDER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (error.code === 'ORDER_NOT_PAYABLE') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to initiate payment.'
    });
  }
};


/**
 * Get payment information for an order
 *
 * GET /api/payments/:orderNumber
 *
 * Requires:
 * Authorization: Bearer <JWT>
 */
const getOrderPayment = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user could not be identified.'
      });
    }

    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required.'
      });
    }

    const payment = await paymentService.getPaymentByOrderNumber({
      userId,
      orderNumber
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.'
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get order payment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve payment information.'
    });
  }
};


/**
 * Payment gateway webhook
 *
 * POST /api/payments/webhook
 *
 * This endpoint is called by the payment gateway.
 */
const paymentWebhook = async (req, res) => {
  try {
    const result = await paymentService.handlePaymentWebhook(
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Payment notification received.',
      result
    });
  } catch (error) {
    console.error('Payment webhook error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to process payment notification.'
    });
  }
};


module.exports = {
  createPayment,
  getOrderPayment,
  paymentWebhook
};