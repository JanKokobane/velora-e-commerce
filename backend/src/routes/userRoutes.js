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


// ============================================================
// PUBLIC AUTH ROUTES
// ============================================================

router.post(
  '/register',
  registerUser
);

router.post(
  '/login',
  loginUser
);


// ============================================================
// LOGGED-IN USER
// ============================================================

router.get(
  '/me',
  userAuthMiddleware,
  getCurrentUser
);


// ============================================================
// ADMIN ROUTES
// ============================================================

router.get(
  '/',
  adminAuthMiddleware,
  getUsers
);

router.get(
  '/:id',
  adminAuthMiddleware,
  getUser
);


// ============================================================
// USER ACCOUNT ROUTES
// ============================================================

router.put(
  '/:id',
  userAuthMiddleware,
  editUser
);

router.delete(
  '/:id',
  userAuthMiddleware,
  removeUser
);


module.exports = router;