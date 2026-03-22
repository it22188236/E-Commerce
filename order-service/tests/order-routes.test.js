const request = require("supertest");
const createApp = require("../src/app");

describe("order-service protected route coverage", () => {
  const app = createApp();

  test("GET /api/orders/user/:userId without token returns 401", async () => {
    const response = await request(app).get("/api/orders/user/user-123");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("DELETE /api/orders/:id without token returns 401", async () => {
    const response = await request(app).delete(
      "/api/orders/507f1f77bcf86cd799439013",
    );

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
