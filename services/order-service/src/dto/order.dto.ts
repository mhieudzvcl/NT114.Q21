import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
class OrderItemDto {
  @IsString() productId!: string;
  @IsNumber() qty!: number;
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
