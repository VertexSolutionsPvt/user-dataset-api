const pool = require('../config/db');

const getCompanies = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM companies');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO companies (name, address) VALUES (?, ?)',
      [name, address || null]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, address: address || null }
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const [company] = await pool.execute('SELECT id FROM companies WHERE id = ?', [id]);
    if (company.length === 0) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No update fields provided' });
    }

    values.push(id);
    await pool.execute(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Company updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompanies, createCompany, updateCompany };