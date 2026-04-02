export declare class CreateNotificationDto {
    userId: string;
    channel: "EMAIL" | "WEBHOOK" | "INAPP";
    title: string;
    content: string;
}
export declare class ListNotificationDto {
    userId?: string;
}
