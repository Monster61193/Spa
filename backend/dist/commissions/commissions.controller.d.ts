import type { Request } from 'express';
import { CommissionsService } from './commissions.service';
export declare class CommissionsController {
    private readonly commissionsService;
    constructor(commissionsService: CommissionsService);
    listar(request: Request & {
        branchId?: string;
    }): {
        items: any;
    };
}
