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
const userOrAdminAuthMiddleware = require('../middleware/userOrAdminAuthMiddleware');

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get(
  '/me',
  userAuthMiddleware,
  getCurrentUser
);

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

router.put(
  '/:id',
  userOrAdminAuthMiddleware,
  editUser
);

router.delete(
  '/:id',
  userOrAdminAuthMiddleware,
  removeUser
);

module.exports = router;

