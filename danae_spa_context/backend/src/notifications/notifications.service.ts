import { Injectable } from '@nestjs/common'
import { notifications_list } from '../common/mocks/sample-data'

/**
 * Servicio para notificaciones a clientes y empleados.
 */
@Injectable()
export class NotificationsService {
  listar(sucursalId: string) {
    return notifications_list[sucursalId] ?? []
  }
}
