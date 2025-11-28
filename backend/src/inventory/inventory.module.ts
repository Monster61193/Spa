import { Module } from '@nestjs/common'
import { InventoryController } from './inventory.controller'
import { InventoryService } from './inventory.service'

/**
 * Módulo para inventario multi-sucursal.
 */
@Module({
  controllers: [InventoryController],
  providers: [InventoryService]
})
export class InventoryModule {}
