import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    RolesGuard
  ]
})
export class AppModule {}
