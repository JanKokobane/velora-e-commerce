const express = require('express');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const { getDrivers, createDriver, updateDriver, removeDriver } = require('../controllers/driverController');

const router = express.Router();
router.use(adminAuthMiddleware);
router.get('/', getDrivers);
router.post('/', createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', removeDriver);

module.exports = router;
