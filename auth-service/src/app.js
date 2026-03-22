const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
  app.use("/api/auth", authRoutes);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "auth-service",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/", (req, res) => {
    res.status(200).json({
      name: "Auth Service",
      version: "1.0.0",
      documentation: "/api-docs",
      health: "/health",
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
};

module.exports = createApp;
