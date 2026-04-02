import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
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
