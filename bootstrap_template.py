from pathlib import Path


FILES = {
    "README.md": """# DevSecOps + GitOps Microservices Template (AWS EKS)

This repository is a starter template for:
- 6 backend services (Node.js) + 1 React frontend
- CI with GitHub Actions and security gates
- Terraform skeleton for AWS EKS
- GitOps deployment manifests for ArgoCD
- ERD and API contracts for thesis/demo

## Services
- api-gateway
- auth-service
- user-service
- product-service
- order-service
- notification-service

## Quick Start (local demo)
1. Install Docker + Docker Compose.
2. Copy `.env.example` to `.env`.
3. Run: `docker compose up -d --build`
4. Open:
   - Frontend: http://localhost:3000
   - Gateway: http://localhost:8080
   - Auth health: http://localhost:8081/health

## Repository layout
- `apps/frontend-web`: React app
- `services/*`: backend services
- `docs/architecture`: ERD and architecture notes
- `docs/api-contract`: API contract for each service
- `infra/terraform`: infrastructure as code scaffold
- `gitops`: K8s manifests + ArgoCD app
""",
    ".env.example": """MONGO_URI=mongodb://mongo:27017
JWT_SECRET=change_me
""",
    "docker-compose.yml": """version: "3.9"
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
    depends_on:
      - auth-service
      - user-service
      - product-service
      - order-service
      - notification-service

  auth-service:
    build: ./services/auth-service
    ports: ["8081:8081"]
    environment:
      - PORT=8081
      - MONGO_URI=${MONGO_URI}
      - DB_NAME=auth_db
      - JWT_SECRET=${JWT_SECRET}
    depends_on: [mongo]

  user-service:
    build: ./services/user-service
    ports: ["8082:8082"]
    environment:
      - PORT=8082
      - MONGO_URI=${MONGO_URI}
      - DB_NAME=user_db
    depends_on: [mongo]

  product-service:
    build: ./services/product-service
    ports: ["8083:8083"]
    environment:
      - PORT=8083
      - MONGO_URI=${MONGO_URI}
      - DB_NAME=product_db
    depends_on: [mongo]

  order-service:
    build: ./services/order-service
    ports: ["8084:8084"]
    environment:
      - PORT=8084
      - MONGO_URI=${MONGO_URI}
      - DB_NAME=order_db
    depends_on: [mongo]

  notification-service:
    build: ./services/notification-service
    ports: ["8085:8085"]
    environment:
      - PORT=8085
      - MONGO_URI=${MONGO_URI}
      - DB_NAME=notification_db
    depends_on: [mongo]

  frontend-web:
    build: ./apps/frontend-web
    ports: ["3000:3000"]
    environment:
      - VITE_API_BASE=http://localhost:8080
    depends_on:
      - api-gateway

volumes:
  mongo_data:
""",
    "docs/architecture/ERD.md": """# ERD (MongoDB logical model)

## 1) auth_db
### users_auth
- _id (ObjectId)
- email (string, unique)
- passwordHash (string)
- status (ACTIVE | DISABLED)
- roleIds (ObjectId[])
- createdAt, updatedAt

### roles
- _id
- code (ADMIN | USER | DEVOPS)
- permissions (string[])

### refresh_tokens
- _id
- userId
- tokenHash
- expiresAt
- revokedAt

## 2) user_db
### profiles
- _id
- userId (from auth-service)
- fullName
- phone
- avatarUrl
- department
- createdAt, updatedAt

## 3) product_db
### products
- _id
- sku (unique)
- name
- description
- price
- stock
- status (ACTIVE | INACTIVE)
- createdAt, updatedAt

## 4) order_db
### orders
- _id
- orderNo (unique)
- userId
- items [{ productId, sku, qty, unitPrice }]
- totalAmount
- status (PENDING | PAID | SHIPPED | CANCELLED)
- createdAt, updatedAt

### payments
- _id
- orderId
- method (COD | CARD)
- amount
- status (INIT | SUCCESS | FAIL)
- transactionRef
- createdAt

## 5) notification_db
### notifications
- _id
- userId
- channel (EMAIL | WEBHOOK | INAPP)
- title
- content
- status (QUEUED | SENT | FAILED)
- createdAt, sentAt

## Service relationships
- auth-service owns identity and roles.
- user-service extends user profile.
- order-service references user and product snapshots.
- notification-service listens to order/auth events.
""",
    "docs/api-contract/API_CONTRACT.md": """# API Contract for 6 Services

## Common
- Base path: `/api/v1`
- Auth: `Authorization: Bearer <JWT>`
- Response envelope:
```json
{ "success": true, "data": {}, "error": null, "meta": {} }
```

## 1) api-gateway
- `POST /api/v1/auth/login` -> forward to auth-service
- `POST /api/v1/auth/register` -> forward to auth-service
- `GET /api/v1/users/me` -> user-service
- `GET /api/v1/products` -> product-service
- `POST /api/v1/orders` -> order-service
- `POST /api/v1/notifications/test` -> notification-service

## 2) auth-service
- `POST /auth/register`
  - body: `{ "email": "a@b.com", "password": "12345678" }`
  - returns: `{ "userId": "...", "email": "a@b.com" }`
- `POST /auth/login`
  - body: `{ "email": "a@b.com", "password": "12345678" }`
  - returns: `{ "accessToken": "...", "refreshToken": "..." }`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /health`

## 3) user-service
- `GET /users/:id`
- `GET /users/me`
- `PATCH /users/:id`
  - body: `{ "fullName": "...", "phone": "...", "avatarUrl": "..." }`
- `GET /health`

## 4) product-service
- `GET /products?search=&page=1&limit=20`
- `POST /products` (ADMIN)
- `GET /products/:id`
- `PATCH /products/:id` (ADMIN)
- `DELETE /products/:id` (ADMIN, soft delete)
- `GET /health`

## 5) order-service
- `POST /orders`
  - body: `{ "items": [{ "productId": "...", "qty": 2 }], "paymentMethod": "COD" }`
- `GET /orders/:id`
- `GET /orders?userId=...`
- `PATCH /orders/:id/status` (ADMIN/OPS)
- `GET /health`

## 6) notification-service
- `POST /notifications`
  - body: `{ "userId":"...", "channel":"EMAIL", "title":"...", "content":"..." }`
- `GET /notifications?userId=...`
- `POST /notifications/retry/:id`
- `GET /health`

## Error model
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload"
  }
}
```
""",
    ".github/workflows/ci-services.yml": """name: ci-services

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:

jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      - id: set-matrix
        run: |
          echo 'matrix={"service":["api-gateway","auth-service","user-service","product-service","order-service","notification-service"]}' >> $GITHUB_OUTPUT

  build-test-scan:
    runs-on: ubuntu-latest
    needs: detect
    strategy:
      fail-fast: false
      matrix: ${{ fromJson(needs.detect.outputs.matrix) }}
    defaults:
      run:
        working-directory: services/${{ matrix.service }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json

      - name: Install deps
        run: npm ci
      - name: Unit test
        run: npm test --if-present
      - name: Build
        run: npm run build --if-present
      - name: Trivy FS scan
        uses: aquasecurity/trivy-action@0.24.0
        with:
          scan-type: "fs"
          scan-ref: "services/${{ matrix.service }}"
          severity: "CRITICAL,HIGH"
          exit-code: "1"

  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
""",
    ".github/workflows/iac-security.yml": """name: iac-security

on:
  pull_request:
    paths:
      - "infra/terraform/**"
  push:
    branches: [ "main", "develop" ]
    paths:
      - "infra/terraform/**"

jobs:
  terraform-security:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infra/terraform/environments/dev
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.8.5
      - name: Terraform fmt
        run: terraform fmt -check -recursive ../../
      - name: Terraform init
        run: terraform init -backend=false
      - name: Terraform validate
        run: terraform validate
      - name: TFLint
        uses: terraform-linters/setup-tflint@v4
      - run: tflint --init && tflint
      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: infra/terraform
      - name: Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: infra/terraform
          quiet: true
          soft_fail: false
""",
    "infra/terraform/environments/dev/providers.tf": """terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
""",
    "infra/terraform/environments/dev/variables.tf": """variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "project_name" {
  type    = string
  default = "devsecops-gitops-microservices"
}
""",
    "infra/terraform/environments/dev/main.tf": """module "network" {
  source       = "../../modules/network"
  project_name = var.project_name
}

module "eks" {
  source         = "../../modules/eks"
  project_name   = var.project_name
  vpc_id         = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
}

output "cluster_name" {
  value = module.eks.cluster_name
}
""",
    "infra/terraform/modules/network/main.tf": """resource "aws_vpc" "this" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-1a"
  tags = { Name = "${var.project_name}-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-southeast-1b"
  tags = { Name = "${var.project_name}-private-b" }
}
""",
    "infra/terraform/modules/network/variables.tf": """variable "project_name" {
  type = string
}
""",
    "infra/terraform/modules/network/outputs.tf": """output "vpc_id" {
  value = aws_vpc.this.id
}

output "private_subnet_ids" {
  value = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}
""",
    "infra/terraform/modules/eks/main.tf": """resource "aws_eks_cluster" "this" {
  name     = "${var.project_name}-eks"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.30"

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = false
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
}

resource "aws_kms_key" "eks" {
  description             = "KMS for EKS secrets encryption"
  deletion_window_in_days = 7
}

resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.project_name}-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}
""",
    "infra/terraform/modules/eks/variables.tf": """variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}
""",
    "infra/terraform/modules/eks/outputs.tf": """output "cluster_name" {
  value = aws_eks_cluster.this.name
}
""",
    "gitops/argocd/application.yaml": """apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: thesis-microservices-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/YOUR_REPO.git
    targetRevision: main
    path: gitops/apps/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: thesis-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
""",
    "gitops/apps/dev/kustomization.yaml": """apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: thesis-dev
resources:
  - namespace.yaml
""",
    "gitops/apps/dev/namespace.yaml": """apiVersion: v1
kind: Namespace
metadata:
  name: thesis-dev
""",
}


SERVICE_PACKAGE = """{
  "name": "__SERVICE__",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "test": "node -e \\"console.log('No tests yet')\\""
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
"""

SERVICE_INDEX = """const express = require("express");
const app = express();
const port = process.env.PORT || __PORT__;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "__SERVICE__", status: "ok" });
});

app.listen(port, () => {
  console.log(`__SERVICE__ listening on ${port}`);
});
"""

SERVICE_DOCKERFILE = """FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE __PORT__
CMD ["npm", "start"]
"""

FRONTEND_PACKAGE = """{
  "name": "frontend-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "vite --host 0.0.0.0 --port 3000"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "vite": "^5.4.19"
  }
}
"""

FRONTEND_DOCKERFILE = """FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
"""

FRONTEND_HTML = """<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Microservices Demo</title>
    <script type="module" src="/src/main.jsx"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"""

FRONTEND_MAIN = """import React from "react";
import { createRoot } from "react-dom/client";

const services = [
  { name: "api-gateway", url: "http://localhost:8080" },
  { name: "auth-service", url: "http://localhost:8081/health" },
  { name: "user-service", url: "http://localhost:8082/health" },
  { name: "product-service", url: "http://localhost:8083/health" },
  { name: "order-service", url: "http://localhost:8084/health" },
  { name: "notification-service", url: "http://localhost:8085/health" }
];

function App() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: 24 }}>
      <h1>DevSecOps Microservices Dashboard</h1>
      <p>Interactive links for 6 backend services:</p>
      <ul>
        {services.map((s) => (
          <li key={s.name}>
            <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
"""

FRONTEND_VITE = """import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
"""


def write(path: str, content: str):
    file_path = Path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")


def create_service(service: str, port: int):
    write(
        f"services/{service}/package.json",
        SERVICE_PACKAGE.replace("__SERVICE__", service),
    )
    write(
        f"services/{service}/src/index.js",
        SERVICE_INDEX.replace("__SERVICE__", service).replace("__PORT__", str(port)),
    )
    write(
        f"services/{service}/Dockerfile",
        SERVICE_DOCKERFILE.replace("__PORT__", str(port)),
    )


def create_frontend():
    write("apps/frontend-web/package.json", FRONTEND_PACKAGE)
    write("apps/frontend-web/index.html", FRONTEND_HTML)
    write("apps/frontend-web/src/main.jsx", FRONTEND_MAIN)
    write("apps/frontend-web/vite.config.js", FRONTEND_VITE)
    write("apps/frontend-web/Dockerfile", FRONTEND_DOCKERFILE)


def main():
    for path, content in FILES.items():
        write(path, content)

    services = [
        ("api-gateway", 8080),
        ("auth-service", 8081),
        ("user-service", 8082),
        ("product-service", 8083),
        ("order-service", 8084),
        ("notification-service", 8085),
    ]
    for service, port in services:
        create_service(service, port)

    create_frontend()
    print("Template bootstrap completed.")


if __name__ == "__main__":
    main()
