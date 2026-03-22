const request = require("supertest");
const createApp = require("../src/app");

describe("product-service API", () => {
  const app = createApp();

  test("GET /health returns healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.service).toBe("product-service");
  });

  test("GET / returns service metadata", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe("Product Service");
  });

  test("POST /api/products without token returns 401", async () => {
    const response = await request(app).post("/api/products").send({
      name: "Test Product",
      category: "electronics",
      description: "test",
      price: 100,
      stock: 2,
      images: [],
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("unknown route returns 404 JSON", async () => {
    const response = await request(app).get("/__not_found__");

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Route not found");
  });
});
