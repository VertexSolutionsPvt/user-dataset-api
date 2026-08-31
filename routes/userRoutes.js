const express = require('express');
const router = express.Router();
const { getUsers, getUserById, editUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/v1/users
// @desc    Fetch all users with company, job, and salary details
// @access  Private (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), getUsers);

// @route   GET /api/v1/users/:id
// @desc    Fetch single user profile by ID
// @access  Private
router.get('/:id', authenticateToken, getUserById);

// @route   PATCH /api/v1/users/edit/:id
// @desc    Modular update for user details (partial or full)
// @access  Private
router.patch('/edit/:id', authenticateToken, editUser);

// @route   DELETE /api/v1/users/delete:id
// @desc    Delete user profile along with associated positions and salaries
// @access  Private (Admin only)
router.delete('/delete/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

module.exports = router;