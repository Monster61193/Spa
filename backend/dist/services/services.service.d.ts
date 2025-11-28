export declare class ServicesService {
    catalogo(): {
        id: string;
        nombre: string;
        precioBase: number;
        duracionMinutos: number;
    }[];
    overrides(sucursalId?: string): {
        servicioId: string;
        sucursalId: string;
        precio: number;
        duracionMinutos: number;
    }[];
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
