# Auth Service

Auth Service manages user registration, login, and profile retrieval using JWT-based authentication.

## Features

- User registration
- User login with JWT token generation
- Authenticated user profile endpoint
- Swagger API documentation
- Jest + Supertest tests

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (auth required)
- `GET /health`
- `GET /api-docs`

## Environment Variables

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
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
