import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Req } from "@nestjs/common";
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("/users/me")
  me(@Req() req: any) {
    return this.appService.user("/api/v1/users/me", req.headers.authorization, undefined, "GET");
  }


  @Get("/products")
  products(@Req() req: any, @Query("search") search?: string) {
    return this.appService.product(`/api/v1/products?search=${search || ""}`, req.headers.authorization, undefined, "GET");
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { sku: { type: "string", example: "SKU-001" }, name: { type: "string", example: "Sản phẩm test" }, price: { type: "number", example: 150000 }, stock: { type: "number", example: 100 }, status: { type: "string", example: "ACTIVE" } } } })
  @Post("/products")
  createProduct(@Req() req: any, @Body() body: unknown) {
    return this.appService.product("/api/v1/products", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { productId: { type: "string", example: "" }, qty: { type: "number", example: 1 } } } } } } })
  @Post("/orders")
  createOrder(@Req() req: any, @Body() body: unknown) {
    return this.appService.order("/api/v1/orders", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @Patch("/orders/:id/status")
  updateOrderStatus(@Req() req: any, @Param("id") id: string, @Body() body: { status: string }) {
    return this.appService.order(`/api/v1/orders/${id}/status`, req.headers.authorization, body, "PATCH");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ schema: { type: "object", properties: { userId: { type: "string", example: "gõ_user_id_vào_đây" }, channel: { type: "string", example: "EMAIL" }, title: { type: "string", example: "Thông báo test" }, content: { type: "string", example: "Nội dung push notify" } } } })
  @Post("/notifications/test")
  testNotify(@Req() req: any, @Body() body: unknown) {
    return this.appService.notification("/api/v1/notifications", req.headers.authorization, body, "POST");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("/notifications/retry/:id")
  retryNotify(@Req() req: any, @Param("id") id: string) {
    return this.appService.notification(`/api/v1/notifications/retry/${id}`, req.headers.authorization, undefined, "POST");
  }
}
