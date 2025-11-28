import { Controller, Get } from '@nestjs/common'
import { AuditService } from './audit.service'

/**
 * Endpoint para revisar el log de auditoría.
 */
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Regresa eventos auditados recientes.
   */
  @Get()
  listar() {
    return { items: this.auditService.listar() }
  }
}
