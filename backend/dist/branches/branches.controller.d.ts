import { BranchesService } from './branches.service';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    mine(): Promise<{
        sucursales: {
            id: string;
            nombre: string;
            zonaHoraria: string;
        }[];
    }>;
}
