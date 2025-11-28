import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { InventoryService } from './inventory.service'

/**
 * Punto de acceso para inventario por sucursal.
 */
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Retorna snapshot de materiales por sucursal.
   */
  @Get()
  listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return { snapshot: this.inventoryService.listar(branchId) }
  }
}
