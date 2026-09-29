const returnService = require('../services/returnService');
const { createNotification } = require('../services/notificationService');

const createMyReturn = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const orderNumber = req.params.orderNumber;
    const reason = String(req.body?.reason || '').trim();
    if (req.user?.role !== 'user' || !userId) {
      return res.status(403).json({ success: false, message: 'Only the order owner can request a return.' });
    }
    if (reason.length < 3 || reason.length > 1000) {
      return res.status(400).json({ success: false, message: 'Return reason must be between 3 and 1000 characters.' });
    }

    const returnRequest = await returnService.createReturnRequest(orderNumber, userId, reason);
    try {
      await createNotification({
        type: 'return_requested',
        category: 'orders',
        title: 'Return Request Received',
        message: `${returnRequest.customer_name} requested a return for order #${returnRequest.order_number}.`,
        entityType: 'return',
        entityId: returnRequest.id,
        actionUrl: '/admin#returns',
        isActionable: true
      });
    } catch (notificationError) {
      console.warn('Return request notification warning:', notificationError.message);
    }

    return res.status(201).json({ success: true, returnRequest });
  } catch (error) {
    const status = error.code === 'ORDER_NOT_FOUND'
      ? 404
      : error.code === 'ORDER_NOT_RETURNABLE'
        ? 409
        : error.code === '23505'
          ? 409
          : 500;
    return res.status(status).json({ success: false, message: error.message || 'Unable to create return request.' });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (req.user?.role !== 'user' || !userId) {
      return res.status(403).json({ success: false, message: 'User access is required.' });
    }
    const returns = await returnService.getReturnsForUser(userId);
    return res.status(200).json({ success: true, returns });
  } catch (error) {
    console.error('Get user returns error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve return requests.' });
  }
};

const getAllReturns = async (req, res) => {
  try {
    if (!req.admin?.admin_id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Administrator access is required.' });
    }
    const returns = await returnService.getReturns();
    return res.status(200).json({ success: true, count: returns.length, returns });
  } catch (error) {
    console.error('Get all returns error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve returns.' });
  }
};

const updateReturn = async (req, res) => {
  const status = String(req.body?.status || '').toLowerCase();
  if (!/^\d+$/.test(String(req.params.id || ''))) {
    return res.status(400).json({ success: false, message: 'Invalid return request ID.' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
  }
  try {
    if (!req.admin?.admin_id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Administrator access is required.' });
    }
    const returnRequest = await returnService.updateReturnStatus(req.params.id, status);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: 'Pending return request not found.' });
    }
    return res.status(200).json({ success: true, returnRequest });
  } catch (error) {
    console.error('Update return error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update return request.' });
  }
};

module.exports = { createMyReturn, getMyReturns, getAllReturns, updateReturn };
