import { PrismaService } from "../prisma/prisma.service";
export declare class AppointmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listar(sucursal_id: string): Promise<{
        id: string;
        fechaHora: Date;
        estado: import(".prisma/client").$Enums.CitaEstado;
        cliente: string;
        servicio: string;
        total: number;
    }[]>;
    agendar(data: {
        usuario_id: string;
        servicio_id: string;
        fecha_hora: string;
    }, sucursal_id: string): Promise<{
        id: string;
        total: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        usuarioId: string | null;
        sucursalId: string;
        empleadoId: string | null;
        servicioId: string | null;
        estado: import(".prisma/client").$Enums.CitaEstado;
        fechaHora: Date;
        anticipo: import("@prisma/client/runtime/library").Decimal;
        notas: string | null;
    }>;
    cerrar(cita_id: string, sucursal_id: string): Promise<{
        id: string;
        sucursal_id: string;
        estado: string;
        mensaje: string;
    }>;
}
