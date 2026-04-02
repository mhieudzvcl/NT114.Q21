import { Body, Controller, Get, Post } from "@nestjs/common";
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
