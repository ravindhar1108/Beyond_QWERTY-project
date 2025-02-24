// config/db.js
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Create the connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: 'auth_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool to promise-based interface
const promisePool = pool.promise();

const initializeDatabase = async () => {
    try {
        // Create database if not exists
        await promisePool.query("CREATE DATABASE IF NOT EXISTS auth_db");
        console.log("Database ensured: auth_db");

        // Switch to auth_db database
        await promisePool.query("USE auth_db");

        // Create users table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
        
        await promisePool.query(createUsersTable);
        console.log("Table ensured: users");

        // Drop existing forms and form_fields tables if they exist
        // We drop form_fields first because it references forms
        await promisePool.query("DROP TABLE IF EXISTS form_fields");
        await promisePool.query("DROP TABLE IF EXISTS forms");

        // Create forms table
        const createFormsTable = `
            CREATE TABLE IF NOT EXISTS forms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                form_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`;
        
        await promisePool.query(createFormsTable);
        console.log("Table ensured: forms");
        
        // Create form_fields table with all required columns
        const createFormFieldsTable = `
            CREATE TABLE IF NOT EXISTS form_fields (
                id INT AUTO_INCREMENT PRIMARY KEY,
                form_id INT NOT NULL,
                field_name VARCHAR(255) NOT NULL,
                field_type VARCHAR(50) NOT NULL,
                is_required BOOLEAN DEFAULT false,
                field_options JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
            )`;
        
        await promisePool.query(createFormFieldsTable);
        console.log("Table ensured: form_fields");

    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
};

module.exports = { pool: promisePool, initializeDatabase };