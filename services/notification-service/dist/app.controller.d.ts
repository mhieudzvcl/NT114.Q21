import { AppService } from "./app.service";
import { CreateNotificationDto } from "./dto/notification.dto";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    health(): {
        service: string;
        status: string;
        timestamp: string;
    };
    create(body: CreateNotificationDto): Promise<import("mongoose").Document<unknown, {}, import("./models/notification.model").INotification, {}, {}> & import("./models/notification.model").INotification & {
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
