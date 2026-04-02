import { AppService } from "./app.service";
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    health(): {
        service: string;
        status: string;
        timestamp: string;
    };
    register(body: {
        email: string;
        password: string;
    }): Promise<any>;
    login(body: {
        email: string;
        password: string;
    }): Promise<any>;
    refresh(body: {
        refreshToken: string;
    }): Promise<any>;
    me(req: any): Promise<any>;
    products(req: any, search?: string): Promise<any>;
    createProduct(req: any, body: unknown): Promise<any>;
    createOrder(req: any, body: unknown): Promise<any>;
    updateOrderStatus(req: any, id: string, body: {
        status: string;
    }): Promise<any>;
    testNotify(req: any, body: unknown): Promise<any>;
    retryNotify(req: any, id: string): Promise<any>;
}
