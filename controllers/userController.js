const pool = require('../config/db');
const bcrypt = require('bcryptjs');

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

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Empty data update request' });
    }

    const fetchQuery = `
      SELECT u.id, u.name, u.email, u.role, u.company_id, 
             c.name AS company, 
             j.title AS position, j.department, j.start_date, 
             s.amount AS salary, s.currency, s.effective_date
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
    const currentDate = new Date().toISOString().split('T')[0];

    // 1. Validate company existence if company_id is modified
    if (Object.prototype.hasOwnProperty.call(updates, 'company_id') && updates.company_id !== null) {
      const [companyRows] = await pool.execute('SELECT id FROM companies WHERE id = ?', [updates.company_id]);
      if (companyRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Provided company does not exist' });
      }
    }

    // 1.1: Add this check inside editUser before processing user fields update:
    if (Object.prototype.hasOwnProperty.call(updates, 'role')) {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can change user roles' });
      }
    }

    // 2. Update primary user fields if changed
    const allowedUserFields = ['name', 'email', 'role', 'company_id'];
    const fieldsToUpdate = [];
    const values = [];

    for (const field of allowedUserFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (updates[field] !== currentUser[field]) {
          fieldsToUpdate.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }
    }

    // 3. Handle optional password update with secure hashing
    if (updates.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(updates.password, saltRounds);
      fieldsToUpdate.push('password = ?');
      values.push(hashedPassword);
    }

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);
    }

    // 4. Handle Job Position update (Optional Nested Object)
    if (updates.position && typeof updates.position === 'object') {
      const newTitle = updates.position.title !== undefined ? updates.position.title : currentUser.position;
      const newDept = updates.position.department !== undefined ? updates.position.department : currentUser.department;
      const newStartDate = updates.position.start_date || currentUser.start_date || currentDate;

      if (newTitle !== currentUser.position || newDept !== currentUser.department || newStartDate !== currentUser.start_date) {
        const [posCheck] = await pool.execute('SELECT id FROM job_positions WHERE user_id = ?', [id]);
        if (posCheck.length > 0) {
          await pool.execute(
            'UPDATE job_positions SET title = ?, department = ?, start_date = ? WHERE user_id = ?',
            [newTitle, newDept, newStartDate, id]
          );
        } else {
          await pool.execute(
            'INSERT INTO job_positions (title, department, start_date, user_id) VALUES (?, ?, ?, ?)',
            [newTitle, newDept, newStartDate, id]
          );
        }
      }
    }

    // 5. Handle Salary update (Optional Nested Object)
    if (updates.salary && typeof updates.salary === 'object') {
      const newAmount = updates.salary.amount !== undefined ? updates.salary.amount : currentUser.salary;
      const newCurrency = updates.salary.currency || currentUser.currency || 'NPR';
      const newEffectiveDate = updates.salary.effective_date || currentUser.effective_date || currentDate;

      if (newAmount !== currentUser.salary || newCurrency !== currentUser.currency || newEffectiveDate !== currentUser.effective_date) {
        const [salCheck] = await pool.execute('SELECT id FROM salaries WHERE user_id = ?', [id]);
        if (salCheck.length > 0) {
          await pool.execute(
            'UPDATE salaries SET amount = ?, currency = ?, effective_date = ? WHERE user_id = ?',
            [newAmount, newCurrency, newEffectiveDate, id]
          );
        } else {
          await pool.execute(
            'INSERT INTO salaries (amount, currency, effective_date, user_id) VALUES (?, ?, ?, ?)',
            [newAmount, newCurrency, newEffectiveDate, id]
          );
        }
      }
    }

    // 6. Return updated comprehensive user profile
    const [updatedRows] = await pool.execute(fetchQuery, [id]);
    res.json({ success: true, message: 'User updated successfully', data: updatedRows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`Attempting to delete user with ID: ${id} by requester ID: ${req.user.id}`);

    // 1. Check if the target user exists
    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // 2. Prevent self-deletion if an admin tries to delete their own account
    if (req.user.id === parseInt(id, 10)) {
      return res.status(400).json({ success: false, error: 'Operation prohibited: You cannot delete your own account' });
    }

    // 3. Delete dependent child records first to prevent foreign key constraint failures
    await pool.execute('DELETE FROM job_positions WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM salaries WHERE user_id = ?', [id]);

    // 4. Delete the user record from the main table
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, editUser, deleteUser };