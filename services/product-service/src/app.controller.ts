import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
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
