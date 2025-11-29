import type { Request } from "express";
import { AppointmentsService } from "./appointments.service";
export declare class AppointmentsController {
    private readonly appointments_service;
    constructor(appointments_service: AppointmentsService);
    listar(request: Request & {
        branchId?: string;
    }): Promise<{
        items: {
            id: string;
            fechaHora: Date;
            estado: import(".prisma/client").$Enums.CitaEstado;
            cliente: string;
            servicio: string;
            total: number;
        }[];
    }>;
    crear(payload: unknown, request: Request & {
        branchId?: string;
    }): Promise<{
        id: string;
        usuarioId: string | null;
        empleadoId: string | null;
        sucursalId: string;
        servicioId: string | null;
        fechaHora: Date;
        estado: import(".prisma/client").$Enums.CitaEstado;
        total: import("@prisma/client/runtime/library").Decimal;
        anticipo: import("@prisma/client/runtime/library").Decimal;
        notas: string | null;
        createdAt: Date;
    }>;
    cerrar(payload: {
        citaId: string;
    }, request: Request & {
        branchId?: string;
    }): Promise<{
        id: string;
        sucursal_id: string;
        estado: string;
        mensaje: string;
    }>;
}
