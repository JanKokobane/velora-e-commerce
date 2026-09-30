const express = require('express');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const { getDrivers, createDriver } = require('../controllers/driverController');

const router = express.Router();
router.use(adminAuthMiddleware);
router.get('/', getDrivers);
router.post('/', createDriver);

module.exports = router;
