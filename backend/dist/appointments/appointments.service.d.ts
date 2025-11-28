export declare class AppointmentsService {
    listar(sucursalId: string): any;
    cerrar(citaId: string, sucursalId: string): {
        id: string;
        sucursalId: string;
        estado: string;
        actualizadoEn: string;
    };
}
