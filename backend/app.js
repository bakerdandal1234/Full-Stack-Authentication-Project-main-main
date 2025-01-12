/**
 * Main Application Entry Point
 *
 * This file sets up the Express application with all necessary middleware,
 * authentication strategies, and route configurations.
 */

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

// Import local modules
const oauth = require("./config/oauth");

// Initialize Express app
const app = express();

// ============================================================================
// Swagger Configuration
// ============================================================================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Authentication API Documentation",
      version: "1.0.0",
      description: "API documentation for the Authentication System",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./router/*.js"], // Path to the API routes
};

const swaggerDocs = require("swagger-jsdoc")(swaggerOptions);
app.use("/api-docs", require("swagger-ui-express").serve, require("swagger-ui-express").setup(swaggerDocs));

// ============================================================================
// Database Configuration
// ============================================================================

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// ============================================================================
// Core Middleware Setup
// ============================================================================

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// إضافة مسار ثابت للصور
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// تطبيق الإعدادات الأمنية
const corsMiddleware = require("./security/cors");
app.use(corsMiddleware);
const apiLimiter = require("./security/rateLimit");
app.use(apiLimiter);

// ============================================================================
// Authentication Setup
// ============================================================================

// Initialize passport middleware
app.use(...oauth.initialize());

// ============================================================================
// Routes Configuration
// ============================================================================

// Import route handlers
const authRouter = require("./router/auth");
const rootRouter = require("./router/root");
const statRouter = require("./router/stats");
const ecommerceRouter = require("./router/ecommerce");

// Mount routes
app.use("/auth", authRouter); // Authentication routes
app.use(rootRouter); // General routes
app.use(statRouter); // Statistics routes
app.use('/api/ecommerce', ecommerceRouter); // مسارات التجارة الإلكترونية

// Error handling middleware
const { authenticationErrorHandler, globalErrorHandler } = require('./utils/errorHandler');
app.use(authenticationErrorHandler);
app.use(globalErrorHandler);

// Protected route example
app.get("/protected", oauth.isAuthenticated, (req, res) => {
  res.json({
    status: "success",
    data: { user: req.user },
  });
});

module.exports = app;
