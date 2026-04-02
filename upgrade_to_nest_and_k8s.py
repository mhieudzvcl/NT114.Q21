from pathlib import Path


SERVICES = [
    ("api-gateway", 8080),
    ("auth-service", 8081),
    ("user-service", 8082),
    ("product-service", 8083),
    ("order-service", 8084),
    ("notification-service", 8085),
]


ROOT_PACKAGE = """{
  "name": "thesis-devsecops-monorepo",
  "private": true,
  "workspaces": [
    "apps/frontend-web",
    "services/*"
  ]
}
"""


TS_CONFIG = """{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": false,
    "skipLibCheck": true
  }
}
"""


SERVICE_PACKAGE = """{
  "name": "__SERVICE__",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "test": "echo \\"No tests yet\\""
  },
  "dependencies": {
    "@nestjs/common": "^10.4.8",
    "@nestjs/core": "^10.4.8",
    "@nestjs/platform-express": "^10.4.8",
    "@nestjs/swagger": "^7.4.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.8",
    "@nestjs/schematics": "^10.1.4",
    "@nestjs/testing": "^10.4.8",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.2"
  }
}
"""


SERVICE_NEST_CLI = """{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
"""


SERVICE_APP_MODULE = """import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
"""


SERVICE_APP_SERVICE = """import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: "__SERVICE__",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
"""


SERVICE_APP_CONTROLLER = """import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiOkResponse({ description: "Service health payload" })
  getHealth() {
    return this.appService.getHealth();
  }
}
"""


SERVICE_MAIN = """import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

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


SERVICE_DOCKERFILE = """FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json nest-cli.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE __PORT__
CMD ["npm", "start"]
"""


INGRESS = """apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: thesis-dev-ingress
  namespace: thesis-dev
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: thesis.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-web
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 8080
"""


FRONTEND_DEPLOY = """apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-web
  template:
    metadata:
      labels:
        app: frontend-web
    spec:
      containers:
        - name: frontend-web
          image: YOUR_ECR/frontend-web:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "300m"
              memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-web
spec:
  selector:
    app: frontend-web
  ports:
    - port: 80
      targetPort: 3000
"""


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def service_k8s(name: str, port: int) -> str:
    return f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: {name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {name}
  template:
    metadata:
      labels:
        app: {name}
    spec:
      containers:
        - name: {name}
          image: YOUR_ECR/{name}:latest
          ports:
            - containerPort: {port}
          env:
            - name: PORT
              value: "{port}"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "400m"
              memory: "512Mi"
          securityContext:
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
---
apiVersion: v1
kind: Service
metadata:
  name: {name}
spec:
  selector:
    app: {name}
  ports:
    - port: {port}
      targetPort: {port}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {name}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {name}
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
"""


def update_readme():
    content = """# DevSecOps + GitOps Microservices Template (AWS EKS)

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
"""
    write("README.md", content)


def create_nest_services():
    for name, port in SERVICES:
        base = Path(f"services/{name}")
        write(str(base / "package.json"), SERVICE_PACKAGE.replace("__SERVICE__", name))
        write(str(base / "nest-cli.json"), SERVICE_NEST_CLI)
        write(str(base / "tsconfig.json"), TS_CONFIG)
        write(str(base / "src/app.module.ts"), SERVICE_APP_MODULE)
        write(str(base / "src/app.service.ts"), SERVICE_APP_SERVICE.replace("__SERVICE__", name))
        write(str(base / "src/app.controller.ts"), SERVICE_APP_CONTROLLER)
        write(
            str(base / "src/main.ts"),
            SERVICE_MAIN.replace("__SERVICE__", name).replace("__PORT__", str(port)),
        )
        write(str(base / "Dockerfile"), SERVICE_DOCKERFILE.replace("__PORT__", str(port)))


def create_gitops_manifests():
    resources = ["namespace.yaml", "ingress.yaml", "frontend-web.yaml"]
    for name, port in SERVICES:
        resources.append(f"{name}.yaml")
        write(f"gitops/apps/dev/{name}.yaml", service_k8s(name, port))

    kustomization = "apiVersion: kustomize.config.k8s.io/v1beta1\\nkind: Kustomization\\nnamespace: thesis-dev\\nresources:\\n"
    for r in resources:
        kustomization += f"  - {r}\\n"
    write("gitops/apps/dev/kustomization.yaml", kustomization)
    write("gitops/apps/dev/ingress.yaml", INGRESS)
    write("gitops/apps/dev/frontend-web.yaml", FRONTEND_DEPLOY)


def main():
    write("package.json", ROOT_PACKAGE)
    create_nest_services()
    create_gitops_manifests()
    update_readme()
    print("Upgraded to NestJS + Swagger + GitOps manifests.")


if __name__ == "__main__":
    main()
