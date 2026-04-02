declare class OrderItemDto {
    productId: string;
    qty: number;
}
export declare class CreateOrderDto {
    userId?: string;
    items: OrderItemDto[];
}
export declare class UpdateOrderStatusDto {
    status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
}
export {};
