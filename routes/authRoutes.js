const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & get JWT token
// @access  Public
router.post('/login', login);

module.exports = router;