import { OnModuleInit } from "@nestjs/common";
export declare class AppService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    create(payload: {
        userId?: string;
        items: {
            productId: string;
            qty: number;
        }[];
    }): Promise<import("mongoose").Document<unknown, {}, import("./models/order.model").IOrder, {}, {}> & import("./models/order.model").IOrder & {
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
    updateStatus(id: string, status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED"): Promise<import("mongoose").FlattenMaps<{
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
