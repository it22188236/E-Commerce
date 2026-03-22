// auth-service/src/server.js
require("dotenv").config();
const connectDB = require("./config/database");
const createApp = require("./app");

const app = createApp();

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
