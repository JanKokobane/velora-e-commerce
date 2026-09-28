const express = require('express');

const {
  registerUser,
  loginUser,
  getCurrentUser,
  getUsers,
  getUser,
  editUser,
  removeUser
} = require('../controllers/userController');

const userAuthMiddleware = require('../middleware/userAuthMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Get currently logged-in user
router.get(
  '/me',
  userAuthMiddleware,
  getCurrentUser
);

// Get all users - Admin only
router.get(
  '/',
  adminAuthMiddleware,
  getUsers
);

// Get a specific user - Admin only
router.get(
  '/:id',
  adminAuthMiddleware,
  getUser
);

// Update user - Authenticated user
router.put(
  '/:id',
  userAuthMiddleware,
  editUser
);

// Delete user - Authenticated user
router.delete(
  '/:id',
  userAuthMiddleware,
  removeUser
);

module.exports = router;