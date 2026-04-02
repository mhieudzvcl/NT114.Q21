# Kich ban demo bao ve 12 phut

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
