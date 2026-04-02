import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException("Missing token");
    try {
      const secret = process.env.JWT_SECRET || "change_me";
      req.user = jwt.verify(token, secret);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
