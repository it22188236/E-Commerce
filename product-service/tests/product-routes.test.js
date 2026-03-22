const request = require("supertest");
const createApp = require("../src/app");

describe("product-service route coverage", () => {
  const app = createApp();

  test("PUT /api/products/:id without token returns 401", async () => {
    const response = await request(app)
      .put("/api/products/507f1f77bcf86cd799439012")
      .send({ name: "Updated Product" });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
