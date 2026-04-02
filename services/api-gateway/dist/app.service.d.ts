export declare class AppService {
    private request;
    getHealth(): {
        service: string;
        status: string;
        timestamp: string;
    };
    auth(path: string, body?: unknown, method?: string): Promise<any>;
    user(path: string, auth: string, body?: unknown, method?: string): Promise<any>;
    product(path: string, auth: string, body?: unknown, method?: string): Promise<any>;
    order(path: string, auth: string, body?: unknown, method?: string): Promise<any>;
    notification(path: string, auth: string, body?: unknown, method?: string): Promise<any>;
}
