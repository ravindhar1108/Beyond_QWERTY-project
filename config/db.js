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
        await promisePool.query(`CREATE DATABASE IF NOT EXISTS auth_db`);
        console.log("Database ensured: auth_db");

        // Switch to auth_db database
        await promisePool.query(`USE auth_db`);

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

    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
};

module.exports = { pool: promisePool, initializeDatabase };