const express = require('express');

const {
  createPayment,
  getOrderPayment,
  getAllPayments,
  paymentWebhook
} = require('../controllers/paymentController');

const userAuthMiddleware = require('../middleware/userAuthMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const router = express.Router();


router.post(
  '/',
  userAuthMiddleware,
  createPayment
);

router.get(
  '/admin',
  adminAuthMiddleware,
  getAllPayments
);

router.get(
  '/:orderNumber',
  userAuthMiddleware,
  getOrderPayment
);

router.post(
  '/webhook',
  paymentWebhook
);


module.exports = router;

