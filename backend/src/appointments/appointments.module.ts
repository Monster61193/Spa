import { Module } from '@nestjs/common'
import { AppointmentsController } from './appointments.controller'
import { AppointmentsService } from './appointments.service'

/**
 * Módulo de citas y flujos de cierre que integran inventario y puntos.
 */
@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService]
})
export class AppointmentsModule {}
