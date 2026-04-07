import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiBody } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

@ApiTags("gateway")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health() {
    return this.appService.getHealth();
  }

  // ======================== AUTH ========================

  @ApiBody({ schema: { type: "object", properties: { email: { type: "string", example: "test@gmail.com" }, password: { type: "string", example: "12345678" } } } })
  @Post("/auth/register")
  register(@Body() body: { email: string; password: string }) {
    return this.appService.auth("/api/v1/auth/register", body, "POST");
  }

  @ApiBody({ schema: { type: "object", properties: { email: { type: "string", example: "test@gmail.com" }, password: { type: "string", example: "12345678" } } } })
  @Post("/auth/login")
  login(@Body() body: { email: string; password: string }) {
    return this.appService.auth("/api/v1/auth/login", body, "POST");
  }

  @ApiBody({ schema: { type: "object", properties: { refreshToken: { type: "string", example: "chuỗi_token_dài_ở_đây" } } } })
  @Post("/auth/refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.appService.auth("/api/v1/auth/refresh", body, "POST");
  }

  @ApiBody({ schema: { type: "object", properties: { refreshToken: { type: "string" } } } })
  @Post("/auth/logout")
  logout(@Body() body: { refreshToken: string }) {
    return this.appService.auth("/api/v1/auth/logout", body, "POST");
  }

  // ======================== USERS ========================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/users/me")
  me(@Req() req: any) {
    return this.appService.user("/api/v1/users/me", req.headers.authorization, undefined, "GET");
  }

  @Get("/users/:id")
  getUserById(@Param("id") id: string) {
    return this.appService.user(`/api/v1/users/${id}`, undefined, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { fullName: { type: "string" }, phone: { type: "string" }, avatarUrl: { type: "string" } } } })
  @Patch("/users/:id")
  updateUser(@Req() req: any, @Param("id") id: string, @Body() body: unknown) {
    return this.appService.user(`/api/v1/users/${id}`, req.headers.authorization, body, "PATCH");
  }

  // ======================== PRODUCTS ========================

  @Get("/products")
  products(@Req() req: any, @Query("search") search?: string) {
    return this.appService.product(`/api/v1/products?search=${search || ""}`, req.headers.authorization, undefined, "GET");
  }

  @Get("/products/:id")
  getProductById(@Param("id") id: string) {
    return this.appService.product(`/api/v1/products/${id}`, undefined, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { sku: { type: "string", example: "SKU-001" }, name: { type: "string", example: "Sản phẩm test" }, price: { type: "number", example: 150000 }, stock: { type: "number", example: 100 }, status: { type: "string", example: "ACTIVE" } } } })
  @Post("/products")
  createProduct(@Req() req: any, @Body() body: unknown) {
    return this.appService.product("/api/v1/products", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { name: { type: "string" }, price: { type: "number" }, stock: { type: "number" }, status: { type: "string" } } } })
  @Patch("/products/:id")
  updateProduct(@Req() req: any, @Param("id") id: string, @Body() body: unknown) {
    return this.appService.product(`/api/v1/products/${id}`, req.headers.authorization, body, "PATCH");
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @Delete("/products/:id")
  deleteProduct(@Req() req: any, @Param("id") id: string) {
    return this.appService.product(`/api/v1/products/${id}`, req.headers.authorization, undefined, "DELETE");
  }

  // ======================== ORDERS ========================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { productId: { type: "string", example: "" }, qty: { type: "number", example: 1 } } } } } } })
  @Post("/orders")
  createOrder(@Req() req: any, @Body() body: unknown) {
    return this.appService.order("/api/v1/orders", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/orders")
  listOrders(@Req() req: any, @Query("userId") userId?: string) {
    const qs = userId ? `?userId=${userId}` : "";
    return this.appService.order(`/api/v1/orders${qs}`, req.headers.authorization, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/orders/:id")
  getOrderById(@Req() req: any, @Param("id") id: string) {
    return this.appService.order(`/api/v1/orders/${id}`, req.headers.authorization, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @Patch("/orders/:id/status")
  updateOrderStatus(@Req() req: any, @Param("id") id: string, @Body() body: { status: string }) {
    return this.appService.order(`/api/v1/orders/${id}/status`, req.headers.authorization, body, "PATCH");
  }

  // ======================== NOTIFICATIONS ========================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { userId: { type: "string", example: "user_id" }, channel: { type: "string", example: "EMAIL" }, title: { type: "string", example: "Thông báo test" }, content: { type: "string", example: "Nội dung push notify" } } } })
  @Post("/notifications")
  createNotification(@Req() req: any, @Body() body: unknown) {
    return this.appService.notification("/api/v1/notifications", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/notifications")
  listNotifications(@Req() req: any, @Query("userId") userId?: string) {
    const qs = userId ? `?userId=${userId}` : "";
    return this.appService.notification(`/api/v1/notifications${qs}`, req.headers.authorization, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/notifications/retry/:id")
  retryNotify(@Req() req: any, @Param("id") id: string) {
    return this.appService.notification(`/api/v1/notifications/retry/${id}`, req.headers.authorization, undefined, "POST");
  }
}
