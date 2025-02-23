const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");  // Update this line
const dotenv = require("dotenv");
const authMiddleware = require("../middleware/authMiddleware");

dotenv.config();
const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        
        if (users.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert User
        await pool.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Registration failed" });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
});

// Protected Route
router.get("/protected", authMiddleware, async (req, res) => {
    try {
        const [user] = await pool.query(
            "SELECT id, username, email FROM users WHERE id = ?",
            [req.user.userId]
        );

        if (!user.length) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Protected route accessed", user: user[0] });
    } catch (error) {
        console.error("Protected route error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;