# Product Service

Product Service manages product catalog operations including CRUD, search, filtering, and inventory-related metadata.

## Features

- Create product (admin)
- List products with pagination and filters
- Get product by ID
- Update product (admin)
- Delete product (admin)
- Swagger API documentation
- Jest + Supertest tests

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (for protected routes)

## API Endpoints

- `POST /api/products` (admin)
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `GET /health`
- `GET /api-docs`

## Environment Variables

```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/products
JWT_SECRET=your_jwt_secret
```

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```
