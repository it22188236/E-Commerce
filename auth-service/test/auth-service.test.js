const request = require("supertest");
const createApp = require("../src/app");

describe("auth-service API", () => {
  const app = createApp();

  test("GET /health returns healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.service).toBe("auth-service");
  });

  test("GET / returns service metadata", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe("Auth Service");
  });

  test("GET /api/auth/profile without token returns 401", async () => {
    const response = await request(app).get("/api/auth/profile");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("unknown route returns 404 JSON", async () => {
    const response = await request(app).get("/__not_found__");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Route not found");
  });
});
