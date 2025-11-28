import type { Request } from 'express';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    listar(request: Request & {
        branchId?: string;
    }): {
        snapshot: any;
    };
}
