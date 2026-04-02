# DevSecOps + GitOps Microservices Template (AWS EKS)

Production-oriented thesis scaffold with:
- 6 NestJS backend services + Swagger
- React frontend
- GitHub Actions CI + IaC security pipeline
- Terraform EKS modules
- GitOps manifests (ArgoCD + Kustomize + HPA + Ingress)

## Run local with Docker Compose
1. Copy `.env.example` -> `.env`
2. Run `docker compose up -d --build`
3. Open:
   - Frontend: `http://localhost:3000`
   - Gateway health: `http://localhost:8080/api/v1/health`
   - Swagger per service: `http://localhost:<port>/docs`

## Services and ports
- api-gateway: 8080
- auth-service: 8081
- user-service: 8082
- product-service: 8083
- order-service: 8084
- notification-service: 8085

## GitOps
- ArgoCD app: `gitops/argocd/application.yaml`
- Kustomize entry: `gitops/apps/dev/kustomization.yaml`

## IaC security checks in CI
- terraform fmt/validate
- tflint
- tfsec
- checkov


## End-to-end API flow (through gateway)
1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login` -> get accessToken
3. `GET /api/v1/products` with `Authorization: Bearer <token>`
4. `POST /api/v1/orders` with token
5. `POST /api/v1/notifications/test` with token

## Demo seed command
- Run `npm run seed:demo` from repository root after `docker compose up -d --build`.
- Or import Postman collection at `docs/postman/DevSecOps_Gateway_E2E.postman_collection.json`.

## Observability manifests
- `gitops/observability/kustomization.yaml`
- Prometheus + Grafana + Loki are ready for ArgoCD sync.


## Metrics and request correlation
- Each service exposes `GET /metrics` (Prometheus text format).
- Each request supports `x-request-id`; if missing, service auto-generates one.
- Logs are JSON lines and include `requestId`, `path`, `statusCode`, `durationMs`.

## Automated API tests (Jest + supertest)
1. Start stack: `docker compose up -d --build`
2. Install root dev deps: `npm install`
3. Run tests: `npm run test:api`


## Observability access (Ingress)
- Grafana: `http://grafana.thesis.local`
- Prometheus: `http://prometheus.thesis.local`
- Default Grafana credentials (demo): `admin / admin123` (from Kubernetes Secret)

## Latency dashboard
- Dashboard `Thesis API Latency` is auto-provisioned.
- Query uses `app_request_duration_ms_sum/count/max` from each service `/metrics`.


## Load test (k6)
- Script: `tests/load/k6-gateway.js`
- Run: `k6 run tests/load/k6-gateway.js`
- Dashboards already include:
  - Throughput (req/s)
  - Error rate (4xx + 5xx)
  - Average and max latency

## Demo script
- `docs/demo/KICH_BAN_BAO_VE_12_PHUT.md`
