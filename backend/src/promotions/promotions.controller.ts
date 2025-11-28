import { Controller, Get, Query } from '@nestjs/common'
import { PromotionsService } from './promotions.service'

/**
 * API para promos activas y su visibilidad por sucursal.
 */
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /**
   * Fila activa de promociones global o por sucursal.
   */
  @Get('active')
  activar(@Query('sucursalId') sucursalId?: string) {
    return { items: this.promotionsService.listar(sucursalId), sucursalId }
  }
}
