# Order Service

Order Service manages order creation, retrieval, status updates, and internal payment-status synchronization for the ecommerce microservices system.

## Features

- Create orders with product validation via Product Service
- Payment initiation via Payment Service
- Internal payment status sync endpoint for payment callbacks
- Order listing with pagination
- User-specific order retrieval
- Admin-only order status updates
- Order deletion (owner or admin)
- Swagger API documentation
- Jest + Supertest test suite

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Express Validator

## API Endpoints

### Public/Internal

- `POST /api/orders/internal/payment-status` (internal service key protected)

### Authenticated

- `POST /api/orders` - create order
- `GET /api/orders` - get current user orders (admin gets all)
- `GET /api/orders/user/:userId` - get orders for a specific user (admin or same user)
- `GET /api/orders/:id` - get single order (admin or owner)
- `PUT /api/orders/:id` - update order status (admin only)
- `DELETE /api/orders/:id` - delete order (admin or owner)

### Health & Docs

- `GET /health`
- `GET /api-docs`

## Environment Variables

Create a `.env` file in `order-service/`:

```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/ecommerce_orders
JWT_SECRET=your_jwt_secret
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
INTERNAL_SERVICE_KEY=internal-service-key
```

## Run Locally

```bash
npm install
npm run dev
```

## Run Tests

```bash
npm test
```
