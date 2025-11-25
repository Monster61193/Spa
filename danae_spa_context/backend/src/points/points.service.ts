import { Injectable } from '@nestjs/common'
import { points_history, points_summary } from '../common/mocks/sample-data'

/**
 * Servicio que expone saldos y movimientos de puntos.
 */
@Injectable()
export class PointsService {
  balance(sucursalId: string) {
    return { saldo: points_summary[sucursalId] ?? [], sucursalId }
  }

  history(sucursalId: string) {
    return points_history[sucursalId] ?? []
  }
}
