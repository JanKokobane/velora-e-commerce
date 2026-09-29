const express = require('express');
const userAuthMiddleware = require('../middleware/userAuthMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const {
  getMyReturns,
  getAllReturns,
  updateReturn
} = require('../controllers/returnController');

const router = express.Router();

router.get('/mine', userAuthMiddleware, getMyReturns);
router.get('/', adminAuthMiddleware, getAllReturns);
router.patch('/:id', adminAuthMiddleware, updateReturn);

module.exports = router;
