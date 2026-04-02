import { AppService } from "./app.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    health(): {
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
    create(body: CreateProductDto): Promise<import("mongoose").Document<unknown, {}, import("./models/product.model").IProduct, {}, {}> & import("./models/product.model").IProduct & {
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
    update(id: string, body: UpdateProductDto): Promise<import("mongoose").FlattenMaps<{
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
