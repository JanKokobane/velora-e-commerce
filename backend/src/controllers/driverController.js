const driverService = require('../services/driverService');
const { createNotification } = require('../services/notificationService');

const getDrivers = async (req, res) => {
  try {
    const drivers = await driverService.getDrivers();
    return res.status(200).json({ success: true, count: drivers.length, drivers });
  } catch (error) {
    console.error('Get drivers error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve drivers.' });
  }
};

const createDriver = async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const phone = String(req.body?.phone || '').trim();
  const province = String(req.body?.province || '').trim();

  if (fullName.length < 2 || fullName.length > 150) {
    return res.status(400).json({ success: false, message: 'Driver name must be between 2 and 150 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid driver email address.' });
  }
  if (phone.length < 7 || phone.length > 30) {
    return res.status(400).json({ success: false, message: 'Enter a valid driver phone number.' });
  }
  if (!province || province.length > 100) {
    return res.status(400).json({ success: false, message: 'Driver province is required.' });
  }

  try {
    const driver = await driverService.createDriver({ fullName, email, phone, province });
    try {
      await createNotification({
        type: 'driver_created',
        category: 'orders',
        title: 'Courier Driver Added',
        message: `${driver.full_name} was added for ${driver.province}.`,
        entityType: 'driver',
        entityId: driver.id,
        actionUrl: '/admin#drivers',
        isActionable: false
      });
    } catch (notificationError) {
      console.warn('Driver creation notification warning:', notificationError.message);
    }
    return res.status(201).json({ success: true, driver });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A driver with this email already exists.' });
    }
    console.error('Create driver error:', error);
    return res.status(500).json({ success: false, message: 'Unable to add driver.' });
  }
};

module.exports = { getDrivers, createDriver };
