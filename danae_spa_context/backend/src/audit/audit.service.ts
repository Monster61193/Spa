import { Injectable } from '@nestjs/common'
import { audit_entries } from '../common/mocks/sample-data'

/**
 * Servicio de auditoría/factura de eventos.
 */
@Injectable()
export class AuditService {
  listar() {
    return audit_entries
  }
}
