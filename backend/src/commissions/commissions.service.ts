import { Injectable } from '@nestjs/common'
import { commissions_log } from '../common/mocks/sample-data'

/**
 * Servicio para comisiones y liquidaciones.
 */
@Injectable()
export class CommissionsService {
  listar(sucursalId: string) {
    return commissions_log[sucursalId] ?? []
  }
}
