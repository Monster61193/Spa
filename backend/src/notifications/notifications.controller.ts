import { Controller, Get, Req } from '@nestjs/common'
import type { Request } from 'express'
import { NotificationsService } from './notifications.service'

/**
 * Endpoints de notificaciones segmentadas por sucursal.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Retorna mensajes pendientes en la sucursal activa.
   */
  @Get()
  listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return { items: this.notificationsService.listar(branchId) }
  }
}
