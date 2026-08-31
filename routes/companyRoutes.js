const express = require('express');
const router = express.Router();
const { getCompanies, createCompany, updateCompany } = require('../controllers/companyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getCompanies);
router.post('/', authenticateToken, authorizeRoles('admin'), createCompany);
router.patch('/edit/:id', authenticateToken, authorizeRoles('admin'), updateCompany);

module.exports = router;