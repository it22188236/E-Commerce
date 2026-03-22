const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const productRoutes = require("./routes/productRoutes");

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
      customSiteTitle: "Product Service API Documentation",
      customfavIcon: "/favicon.ico",
    }),
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpecs);
  });

  app.use("/api/products", productRoutes);

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "product-service",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/", (req, res) => {
    res.status(200).json({
      name: "Product Service",
      version: "1.0.0",
      description: "Product management microservice for e-commerce platform",
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
