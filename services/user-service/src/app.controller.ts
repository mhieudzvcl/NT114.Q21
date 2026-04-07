import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
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
  getMe(@Req() req: any) {
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    let userId = "u_1";
    let email = "";
    if (token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (payload.sub) userId = payload.sub;
            if (payload.email) email = payload.email;
        } catch(e) {}
    }
    return this.appService.getMe(userId, email);
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
