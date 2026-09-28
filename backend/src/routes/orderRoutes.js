const express = require('express');
const jwt = require('jsonwebtoken');

const {
  createPayment,
  getOrderPayment,
  getAllPayments,
  paymentWebhook
} = require('../controllers/paymentController');

const router = express.Router();

const flexibleAuthMiddleware = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required.'
      });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format.'
      });
    }

    const secret =
      process.env.JWT_SECRET ||
      'velora-super-secret-key-change-in-production';

    const decoded = jwt.verify(token, secret);

    req.user = decoded;

    if (
      decoded.role === 'admin' ||
      decoded.admin_id
    ) {
      req.admin = decoded;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
};

router.post(
  '/webhook',
  paymentWebhook
);

router.use(
  flexibleAuthMiddleware
);

router.post(
  '/',
  createPayment
);

router.get(
  '/admin',
  getAllPayments
);

router.get(
  '/:orderNumber',
  getOrderPayment
);

module.exports = router;
