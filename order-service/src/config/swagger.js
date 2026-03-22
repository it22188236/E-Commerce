/**
 * Swagger configuration for Order Service
 * Provides API documentation for order management endpoints
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Order Service API",
      version: "1.0.0",
      description:
        "Order management microservice for e-commerce platform\n\nThis service handles order creation, retrieval, and communicates with Product and Payment services.",
      contact: {
        name: "API Support",
        email: "support@ecommerce.com",
        url: "https://github.com/yourusername/ecommerce-microservices",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5003",
        description: "Development server",
      },
      {
        url: "https://order-service-xxxxx-uc.a.run.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in format: Bearer <token>",
        },
      },
      schemas: {
        OrderItem: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: {
              type: "string",
              example: "507f1f77bcf86cd799439012",
            },
            productName: {
              type: "string",
              example: 'MacBook Pro 16"',
            },
            quantity: {
              type: "integer",
              example: 2,
              minimum: 1,
            },
            price: {
              type: "number",
              format: "float",
              example: 2499.99,
            },
            subtotal: {
              type: "number",
              format: "float",
              example: 4999.98,
            },
          },
        },
        Address: {
          type: "object",
          required: ["street", "city", "state", "zipCode", "country"],
          properties: {
            street: {
              type: "string",
              example: "123 Main St",
            },
            city: {
              type: "string",
              example: "New York",
            },
            state: {
              type: "string",
              example: "NY",
            },
            zipCode: {
              type: "string",
              example: "10001",
            },
            country: {
              type: "string",
              example: "USA",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439013",
            },
            orderNumber: {
              type: "string",
              example: "ORD-240115-1234",
            },
            user: {
              type: "object",
              properties: {
                userId: {
                  type: "string",
                  example: "507f1f77bcf86cd799439011",
                },
                email: {
                  type: "string",
                  example: "john@example.com",
                },
                name: {
                  type: "string",
                  example: "John Doe",
                },
              },
            },
            items: {
              type: "array",
              items: {
                $ref: "#/components/schemas/OrderItem",
              },
            },
            totalAmount: {
              type: "number",
              format: "float",
              example: 4999.98,
            },
            shippingAddress: {
              $ref: "#/components/schemas/Address",
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "completed", "failed", "refunded"],
              example: "completed",
            },
            orderStatus: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
              example: "pending",
            },
            paymentId: {
              type: "string",
              example: "PAY-123456789-001",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:30:00Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        OrderCreateRequest: {
          type: "object",
          required: ["items", "shippingAddress", "paymentMethod"],
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: {
                    type: "string",
                    example: "507f1f77bcf86cd799439012",
                  },
                  quantity: {
                    type: "integer",
                    example: 2,
                    minimum: 1,
                  },
                },
              },
            },
            shippingAddress: {
              $ref: "#/components/schemas/Address",
            },
            paymentMethod: {
              type: "string",
              enum: ["card", "bank_transfer", "cash"],
              example: "card",
            },
          },
        },
        OrderListResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            count: {
              type: "integer",
              example: 5,
            },
            total: {
              type: "integer",
              example: 20,
            },
            page: {
              type: "integer",
              example: 1,
            },
            pages: {
              type: "integer",
              example: 4,
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Order",
              },
            },
          },
        },
        OrderResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Order created successfully",
            },
            data: {
              type: "object",
              properties: {
                order: {
                  $ref: "#/components/schemas/Order",
                },
                payment: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        paymentId: { type: "string" },
                        status: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
      parameters: {
        pageParam: {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            default: 1,
            minimum: 1,
          },
          description: "Page number for pagination",
        },
        limitParam: {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            default: 10,
            minimum: 1,
            maximum: 100,
          },
          description: "Number of items per page",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication failed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "No token provided",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Access denied",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Access denied",
              },
            },
          },
        },
        NotFoundError: {
          description: "Order not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Order not found",
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Orders",
        description: "Order management endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
