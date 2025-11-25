import { Module } from '@nestjs/common'
import { PointsController } from './points.controller'
import { PointsService } from './points.service'

/**
 * Módulo que gestiona puntos por sucursal.
 */
@Module({
  controllers: [PointsController],
  providers: [PointsService]
})
export class PointsModule {}
