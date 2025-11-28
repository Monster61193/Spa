import { PrismaService } from "../prisma/prisma.service";
export declare class ServicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    catalogo(): Promise<{
        id: string;
        nombre: string;
        descripcion: string | null;
        precioBase: number;
        duracionMinutos: number;
        activo: boolean;
    }[]>;
    overrides(sucursal_id?: string): Promise<{
        activo: boolean;
        sucursalId: string;
        duracionMinutos: number;
        servicioId: string;
        precio: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    crear_override(payload: {
        servicioId: string;
        sucursalId: string;
        precio: number;
        duracionMinutos: number;
    }): Promise<{
        activo: boolean;
        servicioId: string;
        sucursalId: string;
        precio: number;
        duracionMinutos: number;
    }>;
}
