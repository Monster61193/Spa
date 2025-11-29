import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AppointmentsService } from "./appointments.service";
import { z } from "zod";

// Esquema de validación para crear cita (snake_case en propiedades)
// ANTES (Causa el error con datos de prueba):
/*
const AgendarSchema = z.object({
  usuario_id: z.string().uuid(),
  servicio_id: z.string().uuid(),
  fecha_hora: z.string().datetime()
})
*/

// AHORA (Correcto para soportar seeds):
const AgendarSchema = z.object({
  usuario_id: z.string().min(1), // Acepta 'user-admin-id'
  servicio_id: z.string().min(1), // Acepta 'serv-1'
  fecha_hora: z.string().datetime(),
});

/**
 * Controlador para agenda de citas y cierres.
 * Protegido globalmente por AuthGuard y BranchGuard.
 */
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments_service: AppointmentsService) {}

  /**
   * Lista las citas de la sucursal activa.
   * * @param request - Request express con el usuario y branch inyectados.
   */
  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    // Si por alguna razón no llega el header (login), usamos fallback a principal
    const branch_id = request.branchId ?? "branch-principal";
    const items = await this.appointments_service.listar(branch_id);
    return { items };
  }

  /**
   * Agenda una nueva cita en la sucursal activa.
   */
  @Post()
  async crear(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";

    // Validamos que el payload tenga la forma correcta con Zod
    const datos_validos = AgendarSchema.parse(payload);

    // Delegamos al servicio
    return this.appointments_service.agendar(datos_validos, branch_id);
  }

  /**
   * Cierra una cita con inventario/puntos/comisiones.
   */
  @Post("close")
  async cerrar(
    @Body() payload: { citaId: string },
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    return this.appointments_service.cerrar(payload.citaId, branch_id);
  }
}
