/**
 * Swagger configuration for Product Service
 * Provides API documentation for product management endpoints
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Service API',
      version: '1.0.0',
      description: 'Product management microservice for e-commerce platform\n\nThis service handles product CRUD operations, inventory management, and product search.',
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
        url: 'http://localhost:5002',
        description: 'Development server'
      },
      {
        url: 'https://product-service-xxxxx-uc.a.run.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in format: Bearer <token> (Admin only for write operations)'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'category'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            name: {
              type: 'string',
              example: 'MacBook Pro 16"',
              maxLength: 100
            },
            description: {
              type: 'string',
              example: 'High-performance laptop with M3 chip, 16GB RAM, 512GB SSD',
              maxLength: 1000
            },
            price: {
              type: 'number',
              format: 'float',
              example: 2499.99,
              minimum: 0
            },
            category: {
              type: 'string',
              enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other'],
              example: 'electronics'
            },
            stock: {
              type: 'integer',
              example: 50,
              minimum: 0,
              default: 0
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://example.com/product.jpg'
                  },
                  alt: {
                    type: 'string',
                    example: 'Product image'
                  }
                }
              }
            },
            createdBy: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        ProductCreateRequest: {
          type: 'object',
          required: ['name', 'description', 'price', 'category'],
          properties: {
            name: {
              type: 'string',
              example: 'MacBook Pro 16"',
              maxLength: 100
            },
            description: {
              type: 'string',
              example: 'High-performance laptop with M3 chip, 16GB RAM, 512GB SSD',
              maxLength: 1000
            },
            price: {
              type: 'number',
              format: 'float',
              example: 2499.99,
              minimum: 0
            },
            category: {
              type: 'string',
              enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other'],
              example: 'electronics'
            },
            stock: {
              type: 'integer',
              example: 50,
              minimum: 0,
              default: 0
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri'
                  },
                  alt: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        ProductUpdateRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'MacBook Pro 16" (Updated)'
            },
            description: {
              type: 'string',
              example: 'Updated description'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 2399.99
            },
            category: {
              type: 'string',
              enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other']
            },
            stock: {
              type: 'integer',
              example: 45
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' }
                }
              }
            }
          }
        },
        ProductListResponse: {
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
            total: {
              type: 'integer',
              example: 100
            },
            page: {
              type: 'integer',
              example: 1
            },
            pages: {
              type: 'integer',
              example: 10
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
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
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          },
          description: 'Page number for pagination'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          description: 'Number of items per page'
        },
        categoryParam: {
          in: 'query',
          name: 'category',
          schema: {
            type: 'string',
            enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'other']
          },
          description: 'Filter by product category'
        },
        minPriceParam: {
          in: 'query',
          name: 'minPrice',
          schema: {
            type: 'number',
            minimum: 0
          },
          description: 'Minimum price filter'
        },
        maxPriceParam: {
          in: 'query',
          name: 'maxPrice',
          schema: {
            type: 'number',
            minimum: 0
          },
          description: 'Maximum price filter'
        },
        searchParam: {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Search products by name or description'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied - Admin only',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Access denied. Admin only.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Product not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Product not found'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Products',
        description: 'Product management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;