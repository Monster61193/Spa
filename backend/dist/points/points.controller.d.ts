import type { Request } from 'express';
import { PointsService } from './points.service';
export declare class PointsController {
    private readonly pointsService;
    constructor(pointsService: PointsService);
    balance(request: Request & {
        branchId?: string;
    }): {
        saldo: any;
        sucursalId: string;
    };
    history(request: Request & {
        branchId?: string;
    }): any;
}
