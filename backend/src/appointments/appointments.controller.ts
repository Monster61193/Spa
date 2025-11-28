import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import type { Request } from 'express'
import { AppointmentsService } from './appointments.service'

/**
 * Controlador para agenda de citas y cierres.
 */
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Lista las citas de la sucursal activa.
   */
  @Get()
  listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return { items: this.appointmentsService.listar(branchId) }
  }

  /**
   * Cierra una cita con inventario/puntos/comisiones.
   */
  @Post('close')
  cerrar(@Body() payload: { citaId: string }, @Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? 'branch-principal'
    return this.appointmentsService.cerrar(payload.citaId, branchId)
  }
}
