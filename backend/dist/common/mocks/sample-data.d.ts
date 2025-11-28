export declare const branches: {
    id: string;
    nombre: string;
    zonaHoraria: string;
}[];
export declare const appointments_catalog: Record<string, any>;
export declare const inventory_snapshot: Record<string, any>;
export declare const promotions_board: Record<string, any>;
export declare const points_summary: Record<string, any>;
export declare const services_catalog: {
    id: string;
    nombre: string;
    precioBase: number;
    duracionMinutos: number;
}[];
export declare const services_overrides: {
    servicioId: string;
    sucursalId: string;
    precio: number;
    duracionMinutos: number;
}[];
export declare const promotions_catalog: {
    id: string;
    nombre: string;
    descuento: number;
    vigente: boolean;
}[];
export declare const points_history: Record<string, any>;
export declare const commissions_log: Record<string, any>;
export declare const audit_entries: {
    entidad: string;
    accion: string;
    descripcion: string;
    sucursalId: string;
}[];
export declare const notifications_list: Record<string, any>;
