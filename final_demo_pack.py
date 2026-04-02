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

type PathMetric = { count: number; sumMs: number; maxMs: number };
const pathMetrics = new Map<string, PathMetric>();
const statusCounters = new Map<string, number>();
let totalRequests = 0;

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
      `app_requests_total{service="__SERVICE__"} ${totalRequests}`,
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
      lines.push(`app_request_duration_ms_sum{service="__SERVICE__",route="${safeRoute}"} ${metric.sumMs}`);
      lines.push(`app_request_duration_ms_count{service="__SERVICE__",route="${safeRoute}"} ${metric.count}`);
      lines.push(`app_request_duration_ms_max{service="__SERVICE__",route="${safeRoute}"} ${metric.maxMs}`);
    }

    for (const [statusCode, count] of statusCounters.entries()) {
      lines.push(`app_requests_status_total{service="__SERVICE__",status_code="${statusCode}"} ${count}`);
    }

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(lines.join("\\n"));
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


K6_SCRIPT = """import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "60s", target: 30 },
    { duration: "30s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"]
  }
};

const BASE = __ENV.BASE_URL || "http://localhost:8080";
let token = "";

function auth() {
  http.post(`${BASE}/api/v1/auth/register`, JSON.stringify({
    email: "admin@example.com",
    password: "12345678"
  }), { headers: { "Content-Type": "application/json" } });

  const login = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({
    email: "admin@example.com",
    password: "12345678"
  }), { headers: { "Content-Type": "application/json" } });

  const body = login.json();
  token = body?.data?.accessToken || body?.accessToken || "";
}

export default function () {
  if (!token) auth();
  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const products = http.get(`${BASE}/api/v1/products`, { headers });
  check(products, { "products ok": (r) => r.status < 500 });

  const order = http.post(
    `${BASE}/api/v1/orders`,
    JSON.stringify({ items: [{ productId: "demo", qty: 1 }] }),
    { headers }
  );
  check(order, { "order ok": (r) => r.status < 500 });

  const notify = http.post(
    `${BASE}/api/v1/notifications/test`,
    JSON.stringify({ userId: "u_1", channel: "EMAIL", title: "k6", content: "load test" }),
    { headers }
  );
  check(notify, { "notify ok": (r) => r.status < 500 });
  sleep(1);
}
"""


DEMO_SCRIPT = """# Kich ban demo bao ve 12 phut

## 0:00 - 1:30 | Gioi thieu de tai
- Muc tieu: pipeline DevSecOps + GitOps cho 6 microservices tren EKS.
- Diem nhan: bao mat tu IaC, CD theo GitOps, observability day du.

## 1:30 - 3:00 | Kien truc he thong
- Frontend React + API Gateway + 5 backend services Node/NestJS.
- MongoDB tach DB logic theo service.
- ArgoCD dong bo tu Git -> Kubernetes.

## 3:00 - 5:00 | Trinh dien CI/CD + Security
- CI: test/build/scan (gitleaks, trivy, tfsec, checkov).
- CD: merge code -> update manifest -> ArgoCD sync.
- Nhan manh rollback bang Git commit/Argo.

## 5:00 - 7:00 | Demo API flow
1. Register/Login qua gateway.
2. Lay token, goi products/orders/notifications.
3. Swagger cho moi service.

## 7:00 - 9:00 | Observability
- Grafana dashboard Overview + API Latency.
- Prometheus scrape metrics tu 6 services.
- Loki cho log tap trung, theo request-id.

## 9:00 - 10:30 | Load test
- Chay k6 script `tests/load/k6-gateway.js`.
- Mo dashboard theo doi throughput, error rate, p95 latency.

## 10:30 - 12:00 | Tong ket va huong phat trien
- Ket qua: he thong tu dong, bao mat, de mo rong.
- Huong tiep theo: hardening policy OPA/Kyverno, canary deployment, SLO/alerting.
"""


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def update_main_files():
    for name, port in SERVICES:
        write(f"services/{name}/src/main.ts", MAIN_TEMPLATE.replace("__SERVICE__", name).replace("__PORT__", port))


def update_latency_dashboard():
    path = Path("gitops/observability/grafana-dashboard-latency.yaml")
    if not path.exists():
        return
    content = path.read_text(encoding="utf-8")
    # Replace dashboard JSON payload with extended version
    new_yaml = """apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard-latency
  namespace: observability
data:
  thesis-latency.json: |
    {
      "id": null,
      "uid": "thesis-latency",
      "title": "Thesis API Latency",
      "schemaVersion": 39,
      "version": 2,
      "refresh": "10s",
      "panels": [
        {
          "type": "timeseries",
          "title": "Average Latency by Service (ms)",
          "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
          "targets": [
            {
              "expr": "sum by(service) (app_request_duration_ms_sum{app_group=\\"thesis-microservices\\"}) / clamp_min(sum by(service) (app_request_duration_ms_count{app_group=\\"thesis-microservices\\"}), 1)",
              "legendFormat": "{{service}}"
            }
          ]
        },
        {
          "type": "timeseries",
          "title": "Max Latency by Service (ms)",
          "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
          "targets": [
            {
              "expr": "max by(service) (app_request_duration_ms_max{app_group=\\"thesis-microservices\\"})",
              "legendFormat": "{{service}}"
            }
          ]
        },
        {
          "type": "timeseries",
          "title": "Throughput (req/s) by Service",
          "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
          "targets": [
            {
              "expr": "sum by(service) (rate(app_requests_total{app_group=\\"thesis-microservices\\"}[1m]))",
              "legendFormat": "{{service}}"
            }
          ]
        },
        {
          "type": "timeseries",
          "title": "Error Rate (4xx+5xx) by Service",
          "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
          "targets": [
            {
              "expr": "sum by(service) (rate(app_requests_status_total{app_group=\\"thesis-microservices\\",status_code=~\\"4..|5..\\"}[1m]))",
              "legendFormat": "{{service}}"
            }
          ]
        }
      ],
      "templating": { "list": [] }
    }
"""
    path.write_text(new_yaml, encoding="utf-8")


def update_prometheus_labels():
    path = Path("gitops/observability/prometheus-config.yaml")
    txt = path.read_text(encoding="utf-8")
    # Ensure each target includes service label for by(service) queries
    if "service: " in txt:
        return
    replacement = """      - job_name: "thesis-services"
        metrics_path: /metrics
        static_configs:
          - targets: ["api-gateway.thesis-dev.svc.cluster.local:8080"]
            labels:
              app_group: "thesis-microservices"
              service: "api-gateway"
          - targets: ["auth-service.thesis-dev.svc.cluster.local:8081"]
            labels:
              app_group: "thesis-microservices"
              service: "auth-service"
          - targets: ["user-service.thesis-dev.svc.cluster.local:8082"]
            labels:
              app_group: "thesis-microservices"
              service: "user-service"
          - targets: ["product-service.thesis-dev.svc.cluster.local:8083"]
            labels:
              app_group: "thesis-microservices"
              service: "product-service"
          - targets: ["order-service.thesis-dev.svc.cluster.local:8084"]
            labels:
              app_group: "thesis-microservices"
              service: "order-service"
          - targets: ["notification-service.thesis-dev.svc.cluster.local:8085"]
            labels:
              app_group: "thesis-microservices"
              service: "notification-service"
"""
    start = txt.find('      - job_name: "thesis-services"')
    if start == -1:
        return
    end = len(txt)
    txt = txt[:start] + replacement + "\n"
    path.write_text(txt, encoding="utf-8")


def update_root_package():
    path = Path("package.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})
    scripts["load:k6"] = "k6 run tests/load/k6-gateway.js"
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def update_readme():
    path = Path("README.md")
    txt = path.read_text(encoding="utf-8")
    extra = """

## Load test (k6)
- Script: `tests/load/k6-gateway.js`
- Run: `k6 run tests/load/k6-gateway.js`
- Dashboards already include:
  - Throughput (req/s)
  - Error rate (4xx + 5xx)
  - Average and max latency

## Demo script
- `docs/demo/KICH_BAN_BAO_VE_12_PHUT.md`
"""
    if "## Load test (k6)" not in txt:
        path.write_text(txt + extra, encoding="utf-8")


def main():
    update_main_files()
    write("tests/load/k6-gateway.js", K6_SCRIPT)
    write("docs/demo/KICH_BAN_BAO_VE_12_PHUT.md", DEMO_SCRIPT)
    update_latency_dashboard()
    update_prometheus_labels()
    update_root_package()
    update_readme()
    print("Final demo pack generated.")


if __name__ == "__main__":
    main()
