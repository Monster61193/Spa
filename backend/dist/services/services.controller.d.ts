import { ServicesService } from "./services.service";
export declare class ServicesController {
    private readonly services_service;
    constructor(services_service: ServicesService);
    catalog(): Promise<{
        items: {
            id: string;
            nombre: string;
            descripcion: string | null;
            precioBase: number;
            duracionMinutos: number;
            activo: boolean;
        }[];
    }>;
    overrides(sucursal_id?: string): Promise<{
        overrides: {
            activo: boolean;
            sucursalId: string;
            duracionMinutos: number;
            servicioId: string;
            precio: import("@prisma/client/runtime/library").Decimal;
        }[];
    }>;
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
