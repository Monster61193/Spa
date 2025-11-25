import { Module } from '@nestjs/common'
import { CommissionsController } from './commissions.controller'
import { CommissionsService } from './commissions.service'

/**
 * Módulo para comisiones y reportes de liquidaciones.
 */
@Module({
  controllers: [CommissionsController],
  providers: [CommissionsService]
})
export class CommissionsModule {}
