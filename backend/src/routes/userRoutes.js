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
  userAuthMiddleware,
  getUsers
);

router.get(
  '/:id',
  userAuthMiddleware,
  getUser
);

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

