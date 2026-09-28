const express = require('express');

const {
  createOrder,
  getMyOrders,
  getMyOrder
} = require('../controllers/orderController');

const userAuthMiddleware = require('../middleware/userAuthMiddleware');

const router = express.Router();

router.use(userAuthMiddleware);
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:orderNumber', getMyOrder);


module.exports = router;

