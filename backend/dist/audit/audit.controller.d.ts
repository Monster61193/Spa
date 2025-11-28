import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    listar(): {
        items: {
            entidad: string;
            accion: string;
            descripcion: string;
            sucursalId: string;
        }[];
    };
}
