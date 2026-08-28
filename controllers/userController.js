const pool = require('../config/db');

const getUsers = async (req, res, next) => {
  try {
    const queryText = `
      SELECT u.id, u.name, u.email, u.role, c.name AS company, j.title AS position, s.amount AS salary
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN job_positions j ON u.id = j.user_id
      LEFT JOIN salaries s ON u.id = s.user_id;
    `;
    const [rows] = await pool.execute(queryText);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT u.id, u.name, u.email, u.role, c.name AS company, j.title AS position, s.amount AS salary
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN job_positions j ON u.id = j.user_id
      LEFT JOIN salaries s ON u.id = s.user_id
      WHERE u.id = ?;
    `;
    const [rows] = await pool.execute(queryText, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById };