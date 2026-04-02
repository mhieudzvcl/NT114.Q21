import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
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

  @Get("/users/me")
  @ApiOperation({ summary: "Get current user profile" })
  getMe() {
    return this.appService.getMe();
  }

  @Get("/users/:id")
  @ApiOperation({ summary: "Get user by profile id" })
  getById(@Param("id") id: string) {
    return this.appService.getById(id);
  }

  @Patch("/users/:id")
  @ApiOperation({ summary: "Update user profile" })
  update(@Param("id") id: string, @Body() body: UpdateUserDto) {
    return this.appService.update(id, body);
  }
}
