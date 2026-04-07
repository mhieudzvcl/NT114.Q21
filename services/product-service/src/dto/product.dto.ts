import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
export class CreateProductDto {
  @IsString()
  sku!: string;
  @IsString()
  name!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsNumber()
  @Min(0)
  price!: number;
  @IsNumber()
  @Min(0)
  stock!: number;
  @IsEnum(["ACTIVE", "INACTIVE"])
  status!: "ACTIVE" | "INACTIVE";
  @IsOptional()
  @IsString()
  category?: string;
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) stock?: number;
  @IsOptional() @IsEnum(["ACTIVE", "INACTIVE"]) status?: "ACTIVE" | "INACTIVE";
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() imageUrl?: string;
}
