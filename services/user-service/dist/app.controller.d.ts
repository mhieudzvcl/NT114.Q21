import { AppService } from "./app.service";
import { UpdateUserDto } from "./dto/user.dto";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    health(): {
        service: string;
        status: string;
        timestamp: string;
    };
    getMe(): Promise<import("mongoose").FlattenMaps<{
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
    update(id: string, body: UpdateUserDto): Promise<import("mongoose").FlattenMaps<{
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
