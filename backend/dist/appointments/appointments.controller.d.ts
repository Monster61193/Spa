import type { Request } from 'express';
import { AppointmentsService } from './appointments.service';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    listar(request: Request & {
        branchId?: string;
    }): {
        items: any;
    };
    cerrar(payload: {
        citaId: string;
    }, request: Request & {
        branchId?: string;
    }): {
        id: string;
        sucursalId: string;
        estado: string;
        actualizadoEn: string;
    };
}
