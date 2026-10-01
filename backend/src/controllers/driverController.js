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

const readDriverPayload = (body = {}) => ({
  fullName: String(body.fullName || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  phone: String(body.phone || '').trim(),
  province: String(body.province || '').trim()
});

const validateDriverPayload = ({ fullName, email, phone, province }) => {
  if (fullName.length < 2 || fullName.length > 150) return 'Driver name must be between 2 and 150 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid driver email address.';
  if (phone.length < 7 || phone.length > 30) return 'Enter a valid driver phone number.';
  if (!province || province.length > 100) return 'Driver province is required.';
  return null;
};

const updateDriver = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
  }
  const driverData = readDriverPayload(req.body);
  const validationError = validateDriverPayload(driverData);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const driver = await driverService.updateDriver(id, driverData);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    try {
      await createNotification({
        type: 'driver_updated',
        category: 'orders',
        title: 'Driver Details Updated',
        message: `${driver.full_name}'s driver details were updated.`,
        entityType: 'driver',
        entityId: driver.id,
        actionUrl: '/admin#drivers',
        isActionable: false
      });
    } catch (notificationError) {
      console.warn('Driver update notification warning:', notificationError.message);
    }
    return res.status(200).json({ success: true, driver });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A driver with this email already exists.' });
    }
    if (error.code === 'DRIVER_ACTIVE_PROVINCE_MISMATCH') {
      return res.status(409).json({ success: false, message: error.message });
    }
    console.error('Update driver error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update driver.' });
  }
};

const removeDriver = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
  }
  try {
    const driver = await driverService.deleteDriver(id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    try {
      await createNotification({
        type: 'driver_deleted',
        category: 'orders',
        title: 'Driver Removed',
        message: `${driver.full_name} was removed from the driver roster. Any active orders were returned to the logistics hub for reassignment.`,
        entityType: 'driver',
        entityId: driver.id,
        actionUrl: '/admin#drivers',
        isActionable: false
      });
    } catch (notificationError) {
      console.warn('Driver deletion notification warning:', notificationError.message);
    }
    return res.status(200).json({ success: true, driver });
  } catch (error) {
    console.error('Delete driver error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete driver.' });
  }
};

module.exports = { getDrivers, createDriver, updateDriver, removeDriver };
