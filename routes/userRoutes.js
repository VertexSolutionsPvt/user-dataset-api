const express = require('express');
const router = express.Router();
const { getUsers, getUserById, editUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/v1/users
// @desc    Fetch all users with company, job, and salary details
// @access  Private (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), getUsers);

// @route   GET /api/v1/users/:id
// @desc    Fetch single user profile by ID
// @access  Private
router.get('/:id', authenticateToken, getUserById);

// @route   PATCH /api/v1/users/:id
// @desc    Modular update for user details (partial or full)
// @access  Private
router.patch('/edit/:id', authenticateToken, editUser);

module.exports = router;