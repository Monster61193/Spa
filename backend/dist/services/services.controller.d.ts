import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    catalog(): {
        data: {
            id: string;
            nombre: string;
            precioBase: number;
            duracionMinutos: number;
        }[];
    };
    overrides(sucursalId?: string): {
        overrides: {
            servicioId: string;
            sucursalId: string;
            precio: number;
            duracionMinutos: number;
        }[];
    };
    crearOverride(payload: {
        servicioId: string;
        sucursalId: string;
        precio: number;
        duracionMinutos: number;
    }): {
        activo: boolean;
        servicioId: string;
        sucursalId: string;
        precio: number;
        duracionMinutos: number;
    };
}
