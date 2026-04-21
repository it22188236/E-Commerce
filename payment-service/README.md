# Payment Service

Payment Service handles payment processing, payment status retrieval, payment gateway callbacks, and notification delivery.

## Features

- Process payment requests
- Handle PayPal notification callbacks
- Retrieve payment details by payment ID
- Send notifications
- Get user notifications
- Swagger API documentation
- Jest + Supertest tests

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (for protected routes)

## API Endpoints

### Payments

- `POST /api/payments/process` (auth required)
- `GET /api/payments/paypal/config` (auth required)
- `POST /api/payments/orders` (auth required) - create PayPal order
- `POST /api/payments/orders/:id/capture` (auth required) - capture approved PayPal order
- `POST /api/payments/notify` (gateway callback)
- `GET /api/payments/:paymentId` (auth required)

### Notifications

- `POST /api/notifications/send` (auth required)
- `GET /api/notifications` (auth required)

### Utility

- `GET /health`
- `GET /api-docs`

## Environment Variables

```env
PORT=5004
MONGODB_URI=mongodb://localhost:27017/payments
JWT_SECRET=your_jwt_secret
ORDER_SERVICE_URL=http://localhost:5003
INTERNAL_SERVICE_KEY=internal-service-key
PAYMENT_PROVIDER=paypal
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_SANDBOX=true
PAYPAL_CURRENCY=USD
```

## PayPal Notes

- Use sandbox app credentials from https://developer.paypal.com/dashboard.
- Backend uses `Environment.Sandbox` for create/capture order flow.
- Payment is considered successful only after `POST /api/payments/orders/:id/capture` returns `COMPLETED`.

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```
