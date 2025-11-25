import { Module } from '@nestjs/common'
import { ServicesController } from './services.controller'
import { ServicesService } from './services.service'

/**
 * Módulo de servicios y overrides aplicados por sucursal.
 */
@Module({
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServicesModule {}
