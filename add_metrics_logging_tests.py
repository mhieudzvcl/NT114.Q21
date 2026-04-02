from pathlib import Path
import json


SERVICES = [
    ("api-gateway", "8080"),
    ("auth-service", "8081"),
    ("user-service", "8082"),
    ("product-service", "8083"),
    ("order-service", "8084"),
    ("notification-service", "8085"),
]


MAIN_TEMPLATE = """import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { randomUUID } from "crypto";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/transform.interceptor";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const express = app.getHttpAdapter().getInstance();

  // Correlation ID + structured request logs
  express.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      console.log(
        JSON.stringify({
          service: "__SERVICE__",
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs
        })
      );
    });
    next();
  });

  // Basic Prometheus text-format metrics endpoint
  express.get("/metrics", (_req, res) => {
    const cpu = process.cpuUsage();
    const mem = process.memoryUsage();
    const metrics = [
      "# HELP nodejs_process_resident_memory_bytes Resident memory size in bytes",
      "# TYPE nodejs_process_resident_memory_bytes gauge",
      `nodejs_process_resident_memory_bytes ${mem.rss}`,
      "# HELP nodejs_process_heap_used_bytes Process heap used in bytes",
      "# TYPE nodejs_process_heap_used_bytes gauge",
      `nodejs_process_heap_used_bytes ${mem.heapUsed}`,
      "# HELP nodejs_process_cpu_user_microseconds Total user CPU time",
      "# TYPE nodejs_process_cpu_user_microseconds counter",
      `nodejs_process_cpu_user_microseconds ${cpu.user}`,
      "# HELP nodejs_process_cpu_system_microseconds Total system CPU time",
      "# TYPE nodejs_process_cpu_system_microseconds counter",
      `nodejs_process_cpu_system_microseconds ${cpu.system}`
    ].join("\\n");
    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(metrics);
  });

  const config = new DocumentBuilder()
    .setTitle("__SERVICE__ API")
    .setDescription("OpenAPI contract for __SERVICE__")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT || "__PORT__");
  await app.listen(port, "0.0.0.0");
  console.log(`__SERVICE__ listening on ${port}`);
}

bootstrap();
"""


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def update_main_files():
    for name, port in SERVICES:
        write(
            f"services/{name}/src/main.ts",
            MAIN_TEMPLATE.replace("__SERVICE__", name).replace("__PORT__", port),
        )


def update_root_package_and_jest():
    root = Path("package.json")
    pkg = json.loads(root.read_text(encoding="utf-8"))
    scripts = pkg.setdefault("scripts", {})
    scripts["test:api"] = "jest --runInBand"
    dev = pkg.setdefault("devDependencies", {})
    dev["jest"] = "^29.7.0"
    dev["supertest"] = "^7.1.1"
    write("package.json", json.dumps(pkg, indent=2))

    write(
        "jest.config.cjs",
        """module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.spec.js"],
  verbose: true
};
""",
    )


def create_e2e_test():
    write(
        "tests/gateway.e2e.spec.js",
        """const request = require("supertest");

const base = process.env.GATEWAY_BASE_URL || "http://localhost:8080";

describe("Gateway E2E flow", () => {
  let token = "";

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
    const res = await request(base)
      .get("/api/v1/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test("create order", async () => {
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
""",
    )


def update_readme():
    p = Path("README.md")
    txt = p.read_text(encoding="utf-8")
    extra = """

## Metrics and request correlation
- Each service exposes `GET /metrics` (Prometheus text format).
- Each request supports `x-request-id`; if missing, service auto-generates one.
- Logs are JSON lines and include `requestId`, `path`, `statusCode`, `durationMs`.

## Automated API tests (Jest + supertest)
1. Start stack: `docker compose up -d --build`
2. Install root dev deps: `npm install`
3. Run tests: `npm run test:api`
"""
    if "Automated API tests (Jest + supertest)" not in txt:
        p.write_text(txt + extra, encoding="utf-8")


def main():
    update_main_files()
    update_root_package_and_jest()
    create_e2e_test()
    update_readme()
    print("Added metrics endpoints, request-id logging, and Jest + supertest tests.")


if __name__ == "__main__":
    main()
