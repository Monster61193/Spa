import { PrismaService } from "../prisma/prisma.service";
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listar_clientes(): Promise<{
        id: string;
        nombre: string;
        email: string;
    }[]>;
}
