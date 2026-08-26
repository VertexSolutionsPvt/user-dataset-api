const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDatabase = async () => {
  // Initial connection without specifying database name to create database if it doesn't exist
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Initializing MySQL Database Schema and Dummy Data...');

    // 1. Create database if it does not exist and use it
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Disable foreign key checks for clean drop order
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('DROP TABLE IF EXISTS attendances;');
    await connection.query('DROP TABLE IF EXISTS salaries;');
    await connection.query('DROP TABLE IF EXISTS job_positions;');
    await connection.query('DROP TABLE IF EXISTS users;');
    await connection.query('DROP TABLE IF EXISTS companies;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 2. Create Companies Table
    await connection.query(`
      CREATE TABLE companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. Create Users Table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // 4. Create Job Positions Table
    await connection.query(`
      CREATE TABLE job_positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(100) NOT NULL,
        department VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 5. Create Salaries Table
    await connection.query(`
      CREATE TABLE salaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'NPR',
        effective_date DATE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 6. Create Attendances Table
    await connection.query(`
      CREATE TABLE attendances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        check_in DATETIME NOT NULL,
        check_out DATETIME,
        status VARCHAR(20) DEFAULT 'present',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('MySQL Tables created successfully. Inserting seed data...');

    // Seed Company
    const [compResult] = await connection.query(`
      INSERT INTO companies (name, address) 
      VALUES ('Vertex Solutions Pvt. Ltd.', 'Boudha, Kathmandu, Nepal');
    `);
    const companyId = compResult.insertId;

    // Hash Password
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Seed Admin & Employee Users
    const [adminResult] = await connection.query(`
      INSERT INTO users (company_id, name, email, password, role)
      VALUES (?, 'Aayush Neupane', 'testuser@vortexsolutions.tech', ?, 'admin');
    `, [companyId, hashedPassword]);

    const [empResult] = await connection.query(`
      INSERT INTO users (company_id, name, email, password, role)
      VALUES (?, 'Lokendra Shrestha', 'lokendra@vortexsolutions.tech', ?, 'employee');
    `, [companyId, hashedPassword]);

    const adminId = adminResult.insertId;
    const empId = empResult.insertId;

    // Seed Job Positions
    await connection.query(`
      INSERT INTO job_positions (user_id, title, department, start_date) VALUES 
      (?, 'HR Manager', 'Human Resources', '2024-01-01'),
      (?, 'Software Engineer Intern', 'Engineering', '2026-01-01');
    `, [adminId, empId]);

    // Seed Salaries
    await connection.query(`
      INSERT INTO salaries (user_id, amount, currency, effective_date) VALUES 
      (?, 120000.00, 'NPR', '2024-01-01'),
      (?, 45000.00, 'NPR', '2026-01-01');
    `, [adminId, empId]);

    // Seed Attendances
    await connection.query(`
      INSERT INTO attendances (user_id, check_in, check_out, status) VALUES 
      (?, NOW() - INTERVAL 9 HOUR, NOW(), 'present'),
      (?, NOW() - INTERVAL 8 HOUR, NOW(), 'present');
    `, [adminId, empId]);

    console.log('MySQL Database initialized and seeded successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await connection.end();
    process.exit();
  }
};

initDatabase();