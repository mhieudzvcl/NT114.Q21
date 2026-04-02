import { OnModuleInit } from "@nestjs/common";
import { IProduct } from "./models/product.model";
export declare class AppService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    list(search?: string): Promise<(import("mongoose").FlattenMaps<{
        sku?: string;
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        status?: "ACTIVE" | "INACTIVE";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    create(payload: {
        sku: string;
        name: string;
        description?: string;
        price: number;
        stock: number;
        status: "ACTIVE" | "INACTIVE";
    }): Promise<import("mongoose").Document<unknown, {}, IProduct, {}, {}> & IProduct & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getById(id: string): Promise<import("mongoose").FlattenMaps<{
        sku?: string;
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        status?: "ACTIVE" | "INACTIVE";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, payload: Partial<IProduct>): Promise<import("mongoose").FlattenMaps<{
        sku?: string;
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        status?: "ACTIVE" | "INACTIVE";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").FlattenMaps<{
        sku?: string;
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        status?: "ACTIVE" | "INACTIVE";
    }> & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
