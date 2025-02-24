// routes/formRoutes.js
const express = require("express");
const { pool } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new form
router.post("/forms", authMiddleware, async (req, res) => {
    try {
        const { formName, fields } = req.body;
        const userId = req.user.userId;

        // Validate request body
        if (!formName || !fields || !Array.isArray(fields)) {
            return res.status(400).json({
                message: "Invalid request body. Required: formName (string) and fields (array)"
            });
        }

        // Validate fields
        for (const field of fields) {
            if (!field.name || !field.type) {
                return res.status(400).json({
                    message: "Each field must have 'name' and 'type' properties"
                });
            }
        }

        console.log('Creating form with data:', {
            userId,
            formName,
            fieldsCount: fields.length
        });

        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert the form
            const [formResult] = await connection.query(
                "INSERT INTO forms (user_id, form_name) VALUES (?, ?)",
                [userId, formName]
            );
            
            console.log('Form inserted, ID:', formResult.insertId);
            const formId = formResult.insertId;

            // Insert all fields
            for (const field of fields) {
                console.log('Inserting field:', field.name);
                await connection.query(
                    `INSERT INTO form_fields 
                    (form_id, field_name, field_type, is_required, field_options) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        formId,
                        field.name,
                        field.type,
                        field.required || false,
                        JSON.stringify(field.options || null)
                    ]
                );
            }

            await connection.commit();
            connection.release();

            res.status(201).json({
                message: "Form created successfully",
                formId: formId
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Transaction error:', error);
            throw error;
        }
    } catch (error) {
        console.error("Form creation error details:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            message: "Failed to create form",
            error: error.message // Adding error message for debugging
        });
    }
});

// Rest of the routes remain the same...

module.exports = router;