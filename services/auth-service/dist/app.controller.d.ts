import { AppService } from "./app.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto/auth.dto";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    register(body: RegisterDto): Promise<{
        message: string;
        userId: string;
        email: string;
        role?: undefined;
    } | {
        userId: string;
        email: string;
        role: "ADMIN" | "USER";
        message?: undefined;
    }>;
    login(body: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(body: RefreshDto): Promise<{
        accessToken: string;
    }>;
    logout(body: RefreshDto): Promise<{
        success: boolean;
    }>;
}
