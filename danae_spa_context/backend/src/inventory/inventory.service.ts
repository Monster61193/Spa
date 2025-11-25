import { Injectable } from '@nestjs/common'
import { inventory_snapshot } from '../common/mocks/sample-data'

/**
 * Servicio que detalla el stock por sucursal.
 */
@Injectable()
export class InventoryService {
  listar(sucursalId: string) {
    return inventory_snapshot[sucursalId] ?? []
  }
}
