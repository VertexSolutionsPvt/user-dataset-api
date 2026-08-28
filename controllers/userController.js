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

const editUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 1. Check for empty request payload
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Empty data update request' });
    }

    // 2. Fetch current user data block to compare existing values
    const fetchQuery = `
      SELECT u.id, u.name, u.email, u.role, u.company_id, c.name AS company, j.title AS position, s.amount AS salary
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN job_positions j ON u.id = j.user_id
      LEFT JOIN salaries s ON u.id = s.user_id
      WHERE u.id = ?;
    `;
    const [currentUserRows] = await pool.execute(fetchQuery, [id]);

    if (currentUserRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const currentUser = currentUserRows[0];
    
    // 2.1. Validate company existence if company_id is provided in the payload
    if (Object.prototype.hasOwnProperty.call(updates, 'company_id') && updates.company_id !== null) {
      const [companyRows] = await pool.execute('SELECT id FROM companies WHERE id = ?', [updates.company_id]);
      if (companyRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Provided company does not exist' });
      }
    }

    // Allowed fields to modify on the primary `users` table
    const allowedFields = ['name', 'email', 'role', 'company_id'];
    const fieldsToUpdate = [];
    const values = [];

    // 3. Compare payload values against DB records
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const newValue = updates[field];
        const currentValue = currentUser[field];

        // Check if value actually changed
        if (newValue !== currentValue) {
          fieldsToUpdate.push(`${field} = ?`);
          values.push(newValue);
        }
      }
    }

    // 4. Return early if no fields were actually changed
    if (fieldsToUpdate.length === 0) {
      return res.status(200).json({ success: true, message: 'No data changed' });
    }

    // 5. Construct & execute dynamic SQL UPDATE query
    values.push(id);
    const updateQueryText = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await pool.execute(updateQueryText, values);

    // 6. Return updated full user payload
    const [updatedRows] = await pool.execute(fetchQuery, [id]);
    res.json({ success: true, message: 'User updated successfully', data: updatedRows[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, editUser };