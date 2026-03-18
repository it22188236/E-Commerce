/**
 * Swagger configuration for Payment Service
 * Provides API documentation for payment processing and notification endpoints
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment & Notification Service API',
      version: '1.0.0',
      description: 'Payment processing and notification microservice for e-commerce platform\n\nThis service handles payment processing and sends order confirmations.',
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com',
        url: 'https://github.com/yourusername/ecommerce-microservices'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5004',
        description: 'Development server'
      },
      {
        url: 'https://payment-service-xxxxx-uc.a.run.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer <token>'
        }
      },
      schemas: {
        Payment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            paymentId: {
              type: 'string',
              example: 'PAY-1705325400123-456'
            },
            orderId: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-240115-1234'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            amount: {
              type: 'number',
              format: 'float',
              example: 4999.98
            },
            currency: {
              type: 'string',
              example: 'USD',
              default: 'USD'
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'paypal', 'bank_transfer', 'cash'],
              example: 'card'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              example: 'completed'
            },
            transactionDetails: {
              type: 'object',
              example: {
                processor: 'simulated',
                transactionId: 'txn_123456789',
                timestamp: '2024-01-15T10:30:00Z'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaymentRequest: {
          type: 'object',
          required: ['orderId', 'orderNumber', 'amount', 'paymentMethod'],
          properties: {
            orderId: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-240115-1234'
            },
            amount: {
              type: 'number',
              format: 'float',
              example: 4999.98,
              minimum: 0
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'paypal', 'bank_transfer', 'cash'],
              example: 'card'
            }
          }
        },
        PaymentResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Payment processed successfully'
            },
            data: {
              type: 'object',
              properties: {
                paymentId: {
                  type: 'string',
                  example: 'PAY-1705325400123-456'
                },
                status: {
                  type: 'string',
                  example: 'completed'
                },
                amount: {
                  type: 'number',
                  example: 4999.98
                },
                orderNumber: {
                  type: 'string',
                  example: 'ORD-240115-1234'
                }
              }
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439015'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            type: {
              type: 'string',
              enum: ['order_confirmation', 'payment_confirmation', 'shipping_update', 'promotional'],
              example: 'order_confirmation'
            },
            channel: {
              type: 'string',
              enum: ['email', 'sms', 'push'],
              example: 'email'
            },
            recipient: {
              type: 'string',
              example: 'john@example.com'
            },
            subject: {
              type: 'string',
              example: 'Order Confirmation #ORD-240115-1234'
            },
            content: {
              type: 'object',
              example: {
                greeting: 'Dear Customer,',
                message: 'Your order has been confirmed.',
                orderDetails: {
                  orderNumber: 'ORD-240115-1234',
                  total: 4999.98
                }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'sent', 'failed'],
              example: 'sent'
            },
            sentAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        NotificationRequest: {
          type: 'object',
          required: ['type', 'userId', 'email', 'order'],
          properties: {
            type: {
              type: 'string',
              enum: ['order_confirmation', 'payment_confirmation', 'shipping_update'],
              example: 'order_confirmation'
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            order: {
              type: 'object',
              required: ['orderNumber', 'items', 'totalAmount'],
              properties: {
                orderNumber: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productName: { type: 'string' },
                      quantity: { type: 'integer' },
                      price: { type: 'number' }
                    }
                  }
                },
                totalAmount: { type: 'number' }
              }
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'paypal', 'bank_transfer', 'cash']
            }
          }
        },
        NotificationListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              example: 10
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Notification'
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Invalid or expired token'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Payment not found'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Payments',
        description: 'Payment processing endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;