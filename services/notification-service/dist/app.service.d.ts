import { OnModuleInit } from "@nestjs/common";
export declare class AppService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    create(payload: {
        userId: string;
        channel: "EMAIL" | "WEBHOOK" | "INAPP";
        title: string;
        content: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("./models/notification.model").INotification, {}, {}> & import("./models/notification.model").INotification & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    list(userId?: string): Promise<(import("mongoose").FlattenMaps<{
        userId?: string;
        channel?: "EMAIL" | "WEBHOOK" | "INAPP";
        title?: string;
        content?: string;
        status?: "QUEUED" | "SENT" | "FAILED";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    retry(id: string): Promise<(import("mongoose").FlattenMaps<{
        userId?: string;
        channel?: "EMAIL" | "WEBHOOK" | "INAPP";
        title?: string;
        content?: string;
        status?: "QUEUED" | "SENT" | "FAILED";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }) | {
        message: string;
    }>;
}
