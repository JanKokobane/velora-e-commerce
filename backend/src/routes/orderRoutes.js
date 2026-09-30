const express = require('express');
const jwt = require('jsonwebtoken');

const {
  createOrder,
  getMyOrders,
  getMyOrder,
  getAllOrders,
  cancelMyOrder,
  deleteOrder
} = require('../controllers/orderController');
const { createMyReturn } = require('../controllers/returnController');

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

    if (decoded.role === 'admin' || decoded.admin_id) {
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

router.use(flexibleAuthMiddleware);

router.post('/', createOrder);

router.get('/', getMyOrders);

router.get('/all', getAllOrders);

router.delete('/:orderNumber', deleteOrder);
router.patch('/:orderNumber/cancel', cancelMyOrder);
router.post('/:orderNumber/returns', createMyReturn);

router.get('/:orderNumber', getMyOrder);

module.exports = router;