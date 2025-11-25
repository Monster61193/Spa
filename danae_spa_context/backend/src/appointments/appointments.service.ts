import { Injectable } from '@nestjs/common'
import { appointments_catalog } from '../common/mocks/sample-data'

/**
 * Servicio de citas basado en mocks y preparada para extender a Prisma.
 */
@Injectable()
export class AppointmentsService {
  listar(sucursalId: string) {
    return appointments_catalog[sucursalId] ?? []
  }

  cerrar(citaId: string, sucursalId: string) {
    return {
      id: citaId,
      sucursalId,
      estado: 'cerrada',
      actualizadoEn: new Date().toISOString()
    }
  }
}
