const express = require("express");
const dotenv = require("dotenv");
const { initializeDatabase } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

dotenv.config();

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

// Routes
app.use("/api", authRoutes);

// Swagger Setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: { title: "Auth API", version: "1.0.0", description: "Authentication API" },
    },
    apis: ["./routes/authRoutes.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();