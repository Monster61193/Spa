import { Injectable } from '@nestjs/common'
import { promotions_board, promotions_catalog } from '../common/mocks/sample-data'

/**
 * Gestión de promociones activas por sucursal.
 */
@Injectable()
export class PromotionsService {
  listar(sucursalId?: string) {
    if (sucursalId) {
      return promotions_board[sucursalId] ?? []
    }
    return promotions_catalog
  }
}
