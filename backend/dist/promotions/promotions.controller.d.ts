import { PromotionsService } from './promotions.service';
export declare class PromotionsController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    activar(sucursalId?: string): {
        items: any;
        sucursalId: string | undefined;
    };
}
