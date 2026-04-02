from pathlib import Path
import json


SERVICES = [
    "api-gateway",
    "auth-service",
    "user-service",
    "product-service",
    "order-service",
    "notification-service",
]


def write(path: str, content: str):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


INTERCEPTOR = """import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null
      }))
    );
  }
}
"""


FILTER = """import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.getResponse() : { message: "Internal server error" };

    response.status(status).json({
      success: false,
      data: null,
      error: message
    });
  }
}
"""


MAIN_TEMPLATE = """import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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


PORTS = {
    "api-gateway": "8080",
    "auth-service": "8081",
    "user-service": "8082",
    "product-service": "8083",
    "order-service": "8084",
    "notification-service": "8085",
}


def ensure_pkg(path: str):
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    deps = data.setdefault("dependencies", {})
    deps["class-validator"] = "^0.14.1"
    deps["class-transformer"] = "^0.5.1"
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")


def update_common_and_main():
    for service in SERVICES:
        write(f"services/{service}/src/common/transform.interceptor.ts", INTERCEPTOR)
        write(f"services/{service}/src/common/http-exception.filter.ts", FILTER)
        write(
            f"services/{service}/src/main.ts",
            MAIN_TEMPLATE.replace("__SERVICE__", service).replace("__PORT__", PORTS[service]),
        )
        ensure_pkg(f"services/{service}/package.json")


AUTH_MODEL = """import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true },
    passwordHash: String,
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" }
  },
  { timestamps: true }
);

const RefreshSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    tokenHash: String
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.AuthUser || mongoose.model("AuthUser", UserSchema);
export const RefreshModel = mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshSchema);
"""

AUTH_DTO = """import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
"""

AUTH_SERVICE_IMPORT_PATCH = """import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDb } from "./db";
import { RefreshModel, UserModel } from "./models/auth.model";
"""

AUTH_CONTROLLER = """import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto/auth.dto";

@ApiTags("auth")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  getHealth() {
    return this.appService.getHealth();
  }

  @Post("/auth/register")
  @ApiOperation({ summary: "Register user" })
  register(@Body() body: RegisterDto) {
    return this.appService.register(body.email, body.password);
  }

  @Post("/auth/login")
  @ApiOperation({ summary: "Login user" })
  login(@Body() body: LoginDto) {
    return this.appService.login(body.email, body.password);
  }

  @Post("/auth/refresh")
  @ApiBearerAuth()
  refresh(@Body() body: RefreshDto) {
    return this.appService.refresh(body.refreshToken);
  }

  @Post("/auth/logout")
  @ApiBearerAuth()
  logout(@Body() body: RefreshDto) {
    return this.appService.logout(body.refreshToken);
  }
}
"""


def update_auth():
    write("services/auth-service/src/models/auth.model.ts", AUTH_MODEL)
    write("services/auth-service/src/dto/auth.dto.ts", AUTH_DTO)
    # overwrite imports + keep rest implementation as-is
    service_path = Path("services/auth-service/src/app.service.ts")
    txt = service_path.read_text(encoding="utf-8")
    start = txt.find("const UserSchema")
    if start > 0:
      txt = AUTH_SERVICE_IMPORT_PATCH + "\n" + txt[txt.find("@Injectable()"):]
      service_path.write_text(txt, encoding="utf-8")
    write("services/auth-service/src/app.controller.ts", AUTH_CONTROLLER)


def update_service_dto_and_model(service: str, model_name: str, model_file: str, schema: str, dto: str, controller: str):
    write(f"services/{service}/src/models/{model_file}", schema)
    write(f"services/{service}/src/dto/{service.replace('-service','')}.dto.ts", dto)
    write(f"services/{service}/src/app.controller.ts", controller)


def update_user():
    schema = """import mongoose from "mongoose";
const ProfileSchema = new mongoose.Schema(
  { userId: { type: String, unique: true, index: true }, fullName: String, phone: String, avatarUrl: String },
  { timestamps: true }
);
export const ProfileModel = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
"""
    dto = """import { IsOptional, IsString } from "class-validator";
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;
  @IsOptional()
  @IsString()
  phone?: string;
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
"""
    controller = """import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { UpdateUserDto } from "./dto/user.dto";

@ApiTags("users")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health() {
    return this.appService.getHealth();
  }

  @Get("/users/:id")
  @ApiOperation({ summary: "Get user by profile id" })
  getById(@Param("id") id: string) {
    return this.appService.getById(id);
  }

  @Get("/users/me")
  @ApiOperation({ summary: "Get current user profile" })
  getMe() {
    return this.appService.getMe();
  }

  @Patch("/users/:id")
  @ApiOperation({ summary: "Update user profile" })
  update(@Param("id") id: string, @Body() body: UpdateUserDto) {
    return this.appService.update(id, body);
  }
}
"""
    update_service_dto_and_model("user-service", "Profile", "profile.model.ts", schema, dto, controller)
    app_service = Path("services/user-service/src/app.service.ts")
    txt = app_service.read_text(encoding="utf-8").replace(
        "const ProfileSchema = new mongoose.Schema(\n  { userId: { type: String, unique: true, index: true }, fullName: String, phone: String, avatarUrl: String },\n  { timestamps: true }\n);\nconst ProfileModel = mongoose.models.Profile || mongoose.model(\"Profile\", ProfileSchema);\n",
        "import { ProfileModel } from \"./models/profile.model\";\n"
    )
    txt = txt.replace("import mongoose from \"mongoose\";\n", "")
    app_service.write_text(txt, encoding="utf-8")


def update_product():
    schema = """import mongoose from "mongoose";
const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },
    name: String,
    description: String,
    price: Number,
    stock: Number,
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
  },
  { timestamps: true }
);
export const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
"""
    dto = """import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
export class CreateProductDto {
  @IsString()
  sku!: string;
  @IsString()
  name!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsNumber()
  @Min(0)
  price!: number;
  @IsNumber()
  @Min(0)
  stock!: number;
  @IsEnum(["ACTIVE", "INACTIVE"])
  status!: "ACTIVE" | "INACTIVE";
}
export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) stock?: number;
  @IsOptional() @IsEnum(["ACTIVE", "INACTIVE"]) status?: "ACTIVE" | "INACTIVE";
}
"""
    controller = """import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";

@ApiTags("products")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get("/health") health() { return this.appService.getHealth(); }
  @Get("/products") @ApiOperation({ summary: "List products" }) list(@Query("search") search?: string) { return this.appService.list(search || ""); }
  @Post("/products") @ApiOperation({ summary: "Create product" }) create(@Body() body: CreateProductDto) { return this.appService.create(body); }
  @Get("/products/:id") @ApiOperation({ summary: "Get product by id" }) getById(@Param("id") id: string) { return this.appService.getById(id); }
  @Patch("/products/:id") @ApiOperation({ summary: "Update product" }) update(@Param("id") id: string, @Body() body: UpdateProductDto) { return this.appService.update(id, body); }
  @Delete("/products/:id") @ApiOperation({ summary: "Soft delete product" }) remove(@Param("id") id: string) { return this.appService.remove(id); }
}
"""
    update_service_dto_and_model("product-service", "Product", "product.model.ts", schema, dto, controller)
    app_service = Path("services/product-service/src/app.service.ts")
    txt = app_service.read_text(encoding="utf-8").replace(
        "import mongoose from \"mongoose\";\n", ""
    )
    txt = txt.replace(
        "const ProductSchema = new mongoose.Schema(\n  {\n    sku: { type: String, unique: true, index: true },\n    name: String,\n    description: String,\n    price: Number,\n    stock: Number,\n    status: { type: String, enum: [\"ACTIVE\", \"INACTIVE\"], default: \"ACTIVE\" }\n  },\n  { timestamps: true }\n);\nconst ProductModel = mongoose.models.Product || mongoose.model(\"Product\", ProductSchema);\n",
        "import { ProductModel } from \"./models/product.model\";\n"
    )
    app_service.write_text(txt, encoding="utf-8")


def update_order():
    schema = """import mongoose from "mongoose";
const OrderSchema = new mongoose.Schema(
  {
    userId: String,
    items: [{ productId: String, qty: Number, unitPrice: Number }],
    totalAmount: Number,
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"], default: "PENDING" }
  },
  { timestamps: true }
);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", OrderSchema);
"""
    dto = """import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
class OrderItemDto {
  @IsString() productId!: string;
  qty!: number;
}
export class CreateOrderDto {
  @IsOptional() @IsString() userId?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
export class UpdateOrderStatusDto {
  @IsEnum(["PENDING", "PAID", "SHIPPED", "CANCELLED"])
  status!: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
}
"""
    controller = """import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";

@ApiTags("orders")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get("/health") health() { return this.appService.getHealth(); }
  @Post("/orders") @ApiOperation({ summary: "Create order" }) create(@Body() body: CreateOrderDto) { return this.appService.create(body); }
  @Get("/orders/:id") @ApiOperation({ summary: "Get order by id" }) getById(@Param("id") id: string) { return this.appService.getById(id); }
  @Get("/orders") @ApiOperation({ summary: "List orders" }) list(@Query("userId") userId?: string) { return this.appService.list(userId); }
  @Patch("/orders/:id/status") @ApiOperation({ summary: "Update order status" }) updateStatus(@Param("id") id: string, @Body() body: UpdateOrderStatusDto) { return this.appService.updateStatus(id, body.status); }
}
"""
    update_service_dto_and_model("order-service", "Order", "order.model.ts", schema, dto, controller)
    app_service = Path("services/order-service/src/app.service.ts")
    txt = app_service.read_text(encoding="utf-8").replace("import mongoose from \"mongoose\";\n", "")
    txt = txt.replace(
        "const OrderSchema = new mongoose.Schema(\n  {\n    userId: String,\n    items: [{ productId: String, qty: Number, unitPrice: Number }],\n    totalAmount: Number,\n    status: { type: String, enum: [\"PENDING\", \"PAID\", \"SHIPPED\", \"CANCELLED\"], default: \"PENDING\" }\n  },\n  { timestamps: true }\n);\nconst OrderModel = mongoose.models.Order || mongoose.model(\"Order\", OrderSchema);\n",
        "import { OrderModel } from \"./models/order.model\";\n"
    )
    app_service.write_text(txt, encoding="utf-8")


def update_notification():
    schema = """import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    userId: String,
    channel: { type: String, enum: ["EMAIL", "WEBHOOK", "INAPP"] },
    title: String,
    content: String,
    status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "SENT" }
  },
  { timestamps: true }
);
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
"""
    dto = """import { IsEnum, IsOptional, IsString } from "class-validator";
export class CreateNotificationDto {
  @IsString() userId!: string;
  @IsEnum(["EMAIL", "WEBHOOK", "INAPP"]) channel!: "EMAIL" | "WEBHOOK" | "INAPP";
  @IsString() title!: string;
  @IsString() content!: string;
}
export class ListNotificationDto {
  @IsOptional() @IsString() userId?: string;
}
"""
    controller = """import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { CreateNotificationDto } from "./dto/notification.dto";

@ApiTags("notifications")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get("/health") health() { return this.appService.getHealth(); }
  @Post("/notifications") @ApiOperation({ summary: "Create notification" }) create(@Body() body: CreateNotificationDto) { return this.appService.create(body); }
  @Get("/notifications") @ApiOperation({ summary: "List notifications" }) list(@Query("userId") userId?: string) { return this.appService.list(userId); }
  @Post("/notifications/retry/:id") @ApiOperation({ summary: "Retry notification" }) retry(@Param("id") id: string) { return this.appService.retry(id); }
}
"""
    update_service_dto_and_model("notification-service", "Notification", "notification.model.ts", schema, dto, controller)
    app_service = Path("services/notification-service/src/app.service.ts")
    txt = app_service.read_text(encoding="utf-8").replace("import mongoose from \"mongoose\";\n", "")
    txt = txt.replace(
        "const NotificationSchema = new mongoose.Schema(\n  {\n    userId: String,\n    channel: { type: String, enum: [\"EMAIL\", \"WEBHOOK\", \"INAPP\"] },\n    title: String,\n    content: String,\n    status: { type: String, enum: [\"QUEUED\", \"SENT\", \"FAILED\"], default: \"SENT\" }\n  },\n  { timestamps: true }\n);\nconst NotificationModel = mongoose.models.Notification || mongoose.model(\"Notification\", NotificationSchema);\n",
        "import { NotificationModel } from \"./models/notification.model\";\n"
    )
    app_service.write_text(txt, encoding="utf-8")


def update_seed_scripts():
    write(
        "scripts/seed-demo.mjs",
        """const baseUrl = process.env.BASE_URL || "http://localhost:8080";

async function req(path, method = "GET", body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return res.json();
}

async function run() {
  const register = await req("/api/v1/auth/register", "POST", { email: "admin@example.com", password: "12345678" });
  console.log("register", register);
  const login = await req("/api/v1/auth/login", "POST", { email: "admin@example.com", password: "12345678" });
  const token = login?.data?.accessToken || login?.accessToken;
  console.log("login", login);
  if (!token) throw new Error("Missing access token");

  const product = await req(
    "/api/v1/products",
    "POST",
    { sku: "SKU-002", name: "Seed Product", description: "seeded", price: 200000, stock: 50, status: "ACTIVE" },
    token
  );
  console.log("product", product);

  const order = await req("/api/v1/orders", "POST", { items: [{ productId: "demo", qty: 1 }] }, token);
  console.log("order", order);

  const notification = await req(
    "/api/v1/notifications/test",
    "POST",
    { userId: "u_1", channel: "EMAIL", title: "seed", content: "seed notification" },
    token
  );
  console.log("notification", notification);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
""",
    )
    root = Path("package.json")
    data = json.loads(root.read_text(encoding="utf-8"))
    scripts = data.setdefault("scripts", {})
    scripts["seed:demo"] = "node scripts/seed-demo.mjs"
    root.write_text(json.dumps(data, indent=2), encoding="utf-8")


def main():
    update_common_and_main()
    update_auth()
    update_user()
    update_product()
    update_order()
    update_notification()
    update_seed_scripts()
    print("Hardening update completed.")


if __name__ == "__main__":
    main()
