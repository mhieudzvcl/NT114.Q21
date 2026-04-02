import { OnModuleInit } from "@nestjs/common";
export declare class AppService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    getMe(userId?: string): Promise<import("mongoose").FlattenMaps<{
        userId?: string;
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getById(id: string): Promise<import("mongoose").FlattenMaps<{
        userId?: string;
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, payload: {
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }): Promise<import("mongoose").FlattenMaps<{
        userId?: string;
        fullName?: string;
        phone?: string;
        avatarUrl?: string;
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
