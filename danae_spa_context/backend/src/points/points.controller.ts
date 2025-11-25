import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { PointsService } from './points.service'

/**
 * Consulta puntos por sucursal.
 */
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  /**
   * Saldo por sucursal.
   */
  @Get('balance')
  balance(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return this.pointsService.balance(branchId)
  }

  /**
   * Historial de movimientos (earn/redeem).
   */
  @Get('history')
  history(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return this.pointsService.history(branchId)
  }
}
