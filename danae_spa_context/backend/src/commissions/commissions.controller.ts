import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { CommissionsService } from './commissions.service'

/**
 * API que expone comisiones calculadas por sucursal.
 */
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  /**
   * Lista comisiones correspondientes a la sucursal activa.
   */
  @Get()
  listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return { items: this.commissionsService.listar(branchId) }
  }
}
