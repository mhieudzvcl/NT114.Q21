# CHECKLIST BAO VE 1 TRANG (DEVSECOPS + GITOPS)

## A. Checklist truoc gio bao ve (10-15 phut)
- `docker compose up -d --build` da chay thanh cong.
- API gateway health ok: `http://localhost:8080/api/v1/health`.
- Swagger mo duoc: gateway + cac service `/docs`.
- Da seed demo: `npm run seed:demo`.
- Grafana mo duoc, co dashboard:
  - `Thesis Microservices Overview`
  - `Thesis API Latency`
- Prometheus scrape du metric `/metrics` cua 6 services.
- K6 script san sang: `k6 run tests/load/k6-gateway.js`.
- Co file demo script: `docs/demo/KICH_BAN_BAO_VE_12_PHUT.md`.

## B. Luong demo 6 buoc (ban ngan gon)
1. Gioi thieu kien truc 6 services + gateway + GitOps + observability.
2. Demo auth flow: register/login lay JWT token.
3. Goi API qua gateway: products -> orders -> notifications.
4. Mo ArgoCD: chung minh sync tu Git sang cluster.
5. Mo Grafana: trinh bay latency/throughput/error-rate.
6. Chay k6 ngan 1-2 phut va quan sat dashboard thay doi realtime.

## C. Cau hoi phan bien thuong gap + tra loi nhanh

### 1) Tai sao chon GitOps thay vi deploy truc tiep tu CI?
- GitOps bien Git thanh nguon su that duy nhat, de audit, rollback va theo doi thay doi.
- ArgoCD pull state tu Git giup giam deploy tay va giam drift cau hinh.

### 2) Diem khac nhau chinh giua DevOps va DevSecOps trong de tai?
- DevSecOps dua security vao xuyen suot pipeline, khong de cuoi moi quet.
- De tai co gate bao mat o code, image va IaC (gitleaks, trivy, tfsec, checkov).

### 3) Bao mat o buoc tao ha tang duoc lam the nao?
- Terraform bat buoc qua fmt/validate/tflint/tfsec/checkov truoc apply.
- EKS private endpoint, ma hoa secrets bang KMS, nguyen tac least privilege.

### 4) Vi sao dung microservices (>=5) thay vi monolith?
- Tach rieng domain de deploy doc lap, scale doc lap, giam blast radius khi loi.
- Phu hop doanh nghiep va dung muc tieu de tai cloud-native.

### 5) Lam sao chung minh he thong “on dinh”?
- Co health endpoint moi service, HPA, metrics realtime, log tap trung.
- Co k6 load test va dashboard theo doi p95/throughput/error rate.

### 6) Neu deployment loi thi rollback nhu the nao?
- Rollback bang commit Git (manifest truoc do), ArgoCD tu sync ve state on dinh.
- Khong can thao tac kubectl tay tren nhieu tai nguyen.

### 7) Tai sao chon stack nay (NestJS, EKS, ArgoCD, Prometheus/Grafana/Loki)?
- NestJS de chuan hoa microservice Node.js nhanh.
- EKS phu hop de tai AWS, ArgoCD phu hop GitOps pull-based.
- Prometheus/Grafana/Loki la bo cloud-native pho bien, de minh chung quan sat.

### 8) Gioi han hien tai cua de tai la gi?
- Quy mo demo, chua toi uu chi phi/hieu nang production.
- Chua lam security nang cao (pentest, policy hardening sau).
- Du kien mo rong voi OPA/Kyverno, canary deployment, SLO/alerting.

## D. 5 cau “chot ha” ket thuc bao cao
- De tai dat muc tieu: tu dong hoa CI/CD theo GitOps cho 6 microservices.
- Security duoc tich hop som va lien tuc trong pipeline.
- He thong co observability day du (metrics, logs, dashboard).
- Co so lieu danh gia qua k6 va dashboard realtime.
- Mo hinh san sang mo rong len production voi hardening bo sung.
