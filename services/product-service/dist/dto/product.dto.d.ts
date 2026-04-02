export declare class CreateProductDto {
    sku: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    status: "ACTIVE" | "INACTIVE";
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: "ACTIVE" | "INACTIVE";
}
