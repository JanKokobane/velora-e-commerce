const express = require('express');

const {
  createPayment,
  getOrderPayment,
  paymentWebhook
} = require('../controllers/paymentController');

const userAuthMiddleware = require('../middleware/userAuthMiddleware');

const router = express.Router();


router.post(
  '/',
  userAuthMiddleware,
  createPayment
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

