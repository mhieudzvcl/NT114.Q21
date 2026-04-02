const request = require("supertest");

const base = process.env.GATEWAY_BASE_URL || "http://localhost:8080";

describe("Gateway E2E flow", () => {
  let token = "";
  beforeAll(async () => {
    const health = await request(base).get("/api/v1/health");
    if (health.status !== 200) {
      throw new Error(
        `Gateway is not ready at ${base}. Start stack with 'docker compose up -d --build'. Health status: ${health.status}`
      );
    }
  });

  test("register/login and get access token", async () => {
    await request(base).post("/api/v1/auth/register").send({
      email: "admin@example.com",
      password: "12345678"
    });

    const loginRes = await request(base).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "12345678"
    });

    expect(loginRes.status).toBeLessThan(500);
    token = loginRes.body?.data?.accessToken || loginRes.body?.accessToken || "";
    expect(token).toBeTruthy();
  });

  test("list products", async () => {
    expect(token).toBeTruthy();
    const res = await request(base)
      .get("/api/v1/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("create order", async () => {
    expect(token).toBeTruthy();
    const res = await request(base)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: "demo", qty: 1 }] });
    expect(res.status).toBe(201);
  });

  test("service metrics endpoint exists", async () => {
    const res = await request(base).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("nodejs_process_resident_memory_bytes");
  });
});
