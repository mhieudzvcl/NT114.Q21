from pathlib import Path


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

  // Correlation ID + structured request logs + duration tracking
  express.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      totalRequests += 1;
      const key = `${req.method} ${req.route?.path || req.path || "unknown"}`;
      const current = pathMetrics.get(key) || { count: 0, sumMs: 0, maxMs: 0 };
      current.count += 1;
      current.sumMs += durationMs;
      current.maxMs = Math.max(current.maxMs, durationMs);
      pathMetrics.set(key, current);

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

  // Prometheus-compatible metrics endpoint
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
      "# TYPE app_request_duration_ms_max gauge"
    ];

    for (const [route, metric] of pathMetrics.entries()) {
      const safeRoute = route.replace(/"/g, "'");
      lines.push(`app_request_duration_ms_sum{service="__SERVICE__",route="${safeRoute}"} ${metric.sumMs}`);
      lines.push(`app_request_duration_ms_count{service="__SERVICE__",route="${safeRoute}"} ${metric.count}`);
      lines.push(`app_request_duration_ms_max{service="__SERVICE__",route="${safeRoute}"} ${metric.maxMs}`);
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


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def update_main():
    for name, port in SERVICES:
        write(
            f"services/{name}/src/main.ts",
            MAIN_TEMPLATE.replace("__SERVICE__", name).replace("__PORT__", port),
        )


def add_observability_manifests():
    write(
        "gitops/observability/ingress.yaml",
        """apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: observability-ingress
  namespace: observability
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: grafana.thesis.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
    - host: prometheus.thesis.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
""",
    )

    write(
        "gitops/observability/grafana-secret.yaml",
        """apiVersion: v1
kind: Secret
metadata:
  name: grafana-admin
  namespace: observability
type: Opaque
stringData:
  GF_SECURITY_ADMIN_USER: admin
  GF_SECURITY_ADMIN_PASSWORD: admin123
""",
    )

    dashboard = """apiVersion: v1
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
      "version": 1,
      "refresh": "10s",
      "panels": [
        {
          "type": "timeseries",
          "title": "Average Latency by Service (ms)",
          "gridPos": { "h": 8, "w": 24, "x": 0, "y": 0 },
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
          "gridPos": { "h": 8, "w": 24, "x": 0, "y": 8 },
          "targets": [
            {
              "expr": "max by(service) (app_request_duration_ms_max{app_group=\\"thesis-microservices\\"})",
              "legendFormat": "{{service}}"
            }
          ]
        }
      ],
      "templating": { "list": [] }
    }
"""
    write("gitops/observability/grafana-dashboard-latency.yaml", dashboard)


def patch_files():
    grafana = Path("gitops/observability/grafana.yaml")
    gtxt = grafana.read_text(encoding="utf-8")
    if "envFrom" not in gtxt:
        gtxt = gtxt.replace(
            "          env:\n            - name: GF_PATHS_PROVISIONING\n              value: /etc/grafana/provisioning\n",
            "          env:\n            - name: GF_PATHS_PROVISIONING\n              value: /etc/grafana/provisioning\n          envFrom:\n            - secretRef:\n                name: grafana-admin\n",
        )
    if "grafana-dashboard-latency" not in gtxt:
        gtxt = gtxt.replace(
            "            - name: grafana-dashboard-thesis\n              mountPath: /var/lib/grafana/dashboards\n",
            "            - name: grafana-dashboard-thesis\n              mountPath: /var/lib/grafana/dashboards\n            - name: grafana-dashboard-latency\n              mountPath: /var/lib/grafana/dashboards-latency\n",
        )
        gtxt = gtxt.replace(
            "        - name: grafana-dashboard-thesis\n          configMap:\n            name: grafana-dashboard-thesis\n",
            "        - name: grafana-dashboard-thesis\n          configMap:\n            name: grafana-dashboard-thesis\n        - name: grafana-dashboard-latency\n          configMap:\n            name: grafana-dashboard-latency\n",
        )
    grafana.write_text(gtxt, encoding="utf-8")

    provider = Path("gitops/observability/grafana-dashboard-provider.yaml")
    ptxt = provider.read_text(encoding="utf-8")
    if "thesis-latency" not in ptxt:
        ptxt = ptxt.replace(
            "        options:\n          path: /var/lib/grafana/dashboards\n",
            "        options:\n          path: /var/lib/grafana/dashboards\n      - name: thesis-latency\n        orgId: 1\n        folder: Thesis\n        type: file\n        disableDeletion: false\n        editable: true\n        options:\n          path: /var/lib/grafana/dashboards-latency\n",
        )
    provider.write_text(ptxt, encoding="utf-8")

    kustom = Path("gitops/observability/kustomization.yaml")
    ktxt = kustom.read_text(encoding="utf-8")
    to_add = [
        "  - grafana-secret.yaml",
        "  - grafana-dashboard-latency.yaml",
        "  - ingress.yaml",
    ]
    for line in to_add:
        if line not in ktxt:
            ktxt += f"{line}\n"
    kustom.write_text(ktxt, encoding="utf-8")

    prom = Path("gitops/observability/prometheus-config.yaml")
    pr = prom.read_text(encoding="utf-8")
    if 'app_group: "thesis-microservices"' in pr and "service:" not in pr:
        pr = pr.replace(
            '              app_group: "thesis-microservices"\n',
            '              app_group: "thesis-microservices"\n',
        )
    prom.write_text(pr, encoding="utf-8")


def update_readme():
    readme = Path("README.md")
    txt = readme.read_text(encoding="utf-8")
    extra = """

## Observability access (Ingress)
- Grafana: `http://grafana.thesis.local`
- Prometheus: `http://prometheus.thesis.local`
- Default Grafana credentials (demo): `admin / admin123` (from Kubernetes Secret)

## Latency dashboard
- Dashboard `Thesis API Latency` is auto-provisioned.
- Query uses `app_request_duration_ms_sum/count/max` from each service `/metrics`.
"""
    if "Observability access (Ingress)" not in txt:
        readme.write_text(txt + extra, encoding="utf-8")


def main():
    update_main()
    add_observability_manifests()
    patch_files()
    update_readme()
    print("Enhanced observability with ingress, grafana secret, and latency dashboard.")


if __name__ == "__main__":
    main()
