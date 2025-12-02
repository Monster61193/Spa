import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AppointmentsService } from "./appointments.service";
import { z } from "zod";

/**
 * Esquema de Validación (DTO) para agendar citas.
 * -----------------------------------------------------------------------------
 * CAMBIO SPRINT 1:
 * - Reemplazamos `servicio_id` (string) por `servicios_ids` (array de strings).
 * - Validamos que el array no esté vacío (.min(1)).
 */
const AgendarSchema = z.object({
  usuario_id: z.string().min(1, "El ID del usuario es obligatorio"),
  // Validación de Array: Debe ser una lista de strings y tener al menos uno.
  servicios_ids: z
    .array(z.string().min(1))
    .min(1, "Debes seleccionar al menos un servicio"),
  fecha_hora: z.string().datetime("Formato de fecha inválido (ISO 8601)"),
});

/**
 * Controlador de Citas (API Gateway).
 * Expone los endpoints REST protegidos para la gestión de la agenda.
 */
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments_service: AppointmentsService) {}

  /**
   * GET /appointments
   * Lista las citas de la sucursal activa.
   *
   * @param request - Petición con usuario y branch inyectados por los Guards.
   */
  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    const branch_id = request.branchId ?? "branch-principal";
    const items = await this.appointments_service.listar(branch_id);
    return { items };
  }

  /**
   * POST /appointments
   * Agenda una nueva cita con soporte para múltiples servicios.
   *
   * @param payload - JSON con { usuario_id, servicios_ids, fecha_hora }.
   * @param request - Contexto de la sucursal activa.
   */
  @Post()
  async crear(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";

    // 1. Validación de Estructura (Zod)
    // Si el payload no cumple (ej. array vacío), lanza BadRequestException automáticamente.
    const datos_validos = AgendarSchema.parse(payload);

    // 2. Delegación a Lógica de Negocio
    return this.appointments_service.agendar(datos_validos, branch_id);
  }

  /**
   * POST /appointments/close
   * Cierra una cita, procesando inventario, puntos y comisiones.
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
