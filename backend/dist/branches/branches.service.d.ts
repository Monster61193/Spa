import { PrismaService } from '../prisma/prisma.service';
export declare class BranchesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listar(): Promise<{
        id: string;
        nombre: string;
        zonaHoraria: string;
    }[]>;
}
