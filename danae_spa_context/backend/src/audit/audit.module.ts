import { Module } from '@nestjs/common'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'

/**
 * Módulo de observabilidad, auditoría y trazabilidad.
 */
@Module({
  controllers: [AuditController],
  providers: [AuditService]
})
export class AuditModule {}
