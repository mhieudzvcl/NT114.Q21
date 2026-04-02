import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { randomUUID } from "crypto";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/transform.interceptor";
import { HttpExceptionFilter } from "./common/http-exception.filter";

type PathMetric = { count: number; sumMs: number; maxMs: number };
const pathMetrics = new Map<string, PathMetric>();
const statusCounters = new Map<string, number>();
let totalRequests = 0;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const express = app.getHttpAdapter().getInstance();

  express.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      totalRequests += 1;
      const routeKey = `${req.method} ${req.route?.path || req.path || "unknown"}`;
      const current = pathMetrics.get(routeKey) || { count: 0, sumMs: 0, maxMs: 0 };
      current.count += 1;
      current.sumMs += durationMs;
      current.maxMs = Math.max(current.maxMs, durationMs);
      pathMetrics.set(routeKey, current);

      const code = String(res.statusCode);
      statusCounters.set(code, (statusCounters.get(code) || 0) + 1);

      console.log(
        JSON.stringify({
          service: "api-gateway",
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

  express.get("/metrics", (_req, res) => {
    const cpu = process.cpuUsage();
    const mem = process.memoryUsage();
    const lines = [
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
      `nodejs_process_cpu_system_microseconds ${cpu.system}`,
      "# HELP app_requests_total Total requests handled by service",
      "# TYPE app_requests_total counter",
      `app_requests_total{service="api-gateway"} ${totalRequests}`,
      "# HELP app_request_duration_ms_sum Sum of request duration in ms by route",
      "# TYPE app_request_duration_ms_sum counter",
      "# HELP app_request_duration_ms_count Count of requests by route",
      "# TYPE app_request_duration_ms_count counter",
      "# HELP app_request_duration_ms_max Max request duration in ms by route",
      "# TYPE app_request_duration_ms_max gauge",
      "# HELP app_requests_status_total Requests by status code",
      "# TYPE app_requests_status_total counter"
    ];

    for (const [route, metric] of pathMetrics.entries()) {
      const safeRoute = route.replace(/"/g, "'");
      lines.push(`app_request_duration_ms_sum{service="api-gateway",route="${safeRoute}"} ${metric.sumMs}`);
      lines.push(`app_request_duration_ms_count{service="api-gateway",route="${safeRoute}"} ${metric.count}`);
      lines.push(`app_request_duration_ms_max{service="api-gateway",route="${safeRoute}"} ${metric.maxMs}`);
    }

    for (const [statusCode, count] of statusCounters.entries()) {
      lines.push(`app_requests_status_total{service="api-gateway",status_code="${statusCode}"} ${count}`);
    }

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(lines.join("\n"));
  });

  const config = new DocumentBuilder()
    .setTitle("api-gateway API")
    .setDescription("OpenAPI contract for api-gateway")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT || "8080");
  await app.listen(port, "0.0.0.0");
  console.log(`api-gateway listening on ${port}`);
}

bootstrap();
