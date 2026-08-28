const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & get JWT token
// @access  Public
router.post('/login', login);

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

module.exports = router;