import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
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
