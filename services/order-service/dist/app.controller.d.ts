import { AppService } from "./app.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/order.dto";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    health(): {
        service: string;
        status: string;
        timestamp: string;
    };
    create(body: CreateOrderDto): Promise<import("mongoose").Document<unknown, {}, import("./models/order.model").IOrder, {}, {}> & import("./models/order.model").IOrder & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getById(id: string): Promise<import("mongoose").FlattenMaps<{
        userId?: string;
        items?: {
            productId?: string;
            qty?: number;
            unitPrice?: number;
        }[];
        totalAmount?: number;
        status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    list(userId?: string): Promise<(import("mongoose").FlattenMaps<{
        userId?: string;
        items?: {
            productId?: string;
            qty?: number;
            unitPrice?: number;
        }[];
        totalAmount?: number;
        status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    updateStatus(id: string, body: UpdateOrderStatusDto): Promise<import("mongoose").FlattenMaps<{
        userId?: string;
        items?: {
            productId?: string;
            qty?: number;
            unitPrice?: number;
        }[];
        totalAmount?: number;
        status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
