import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    listar(request: Request & {
        branchId?: string;
    }): {
        items: any;
    };
}
