import { IsEnum, IsOptional, IsString } from "class-validator";
export class CreateNotificationDto {
  @IsString() userId!: string;
  @IsEnum(["EMAIL", "WEBHOOK", "INAPP"]) channel!: "EMAIL" | "WEBHOOK" | "INAPP";
  @IsString() title!: string;
  @IsString() content!: string;
}
export class ListNotificationDto {
  @IsOptional() @IsString() userId?: string;
}
