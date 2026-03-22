const request = require("supertest");
const createApp = require("../src/app");

describe("auth-service route coverage", () => {
  const app = createApp();

  test("POST /api/auth/login with missing body returns 400", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
