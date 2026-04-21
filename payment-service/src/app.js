const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpecs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Payment & Notification Service API Documentation",
      customfavIcon: "/favicon.ico",
    }),
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpecs);
  });

  app.use("/api/payments", paymentRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "payment-service",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/", (req, res) => {
    res.status(200).json({
      name: "Payment & Notification Service",
      version: "1.0.0",
      description:
        "Payment processing and notification microservice for e-commerce platform",
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
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
};

module.exports = createApp;
