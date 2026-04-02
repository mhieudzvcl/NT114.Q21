import { OnModuleInit } from "@nestjs/common";
export declare class AppService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    private sign;
    register(email: string, password: string): Promise<{
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
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string): Promise<{
        success: boolean;
    }>;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
}
