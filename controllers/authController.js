const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Authentication successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, company_id = null } = req.body;

    // 1. Validate required fields including password
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // 2. Check if user already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    // 3. Hash the password securely
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Force role to 'user' to prevent privilege escalation on public registration
    const role = 'user';

    // 5. Insert new user into database
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, company_id]
    );

    // 6. Respond with created user data
    res.status(201).json({
      success: true,
      data: { 
        id: result.insertId, 
        name, 
        email, 
        role, 
        company_id 
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register };