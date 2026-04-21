const request = require("supertest");
const createApp = require("../src/app");

describe("payment-service route coverage", () => {
  const app = createApp();

  test("POST /api/payments/notify with invalid payload returns 400", async () => {
    const response = await request(app).post("/api/payments/notify").send({});

    expect(response.statusCode).toBe(400);
  });
});
