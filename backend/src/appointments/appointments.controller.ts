import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AppointmentsService } from "./appointments.service";
import { z } from "zod";

/**
 * Esquema de Validación (DTO) actualizado para incluir empleado.
 * Hacemos que el empleado sea opcional al agendar (puede asignarse después),
 * pero recomendado.
 */
const AgendarSchema = z.object({
  usuario_id: z.string().min(1, "El ID del usuario es obligatorio"),
  // Nuevo campo validado: UUID del empleado (tabla empleados, no usuarios)
  empleado_id: z.string().uuid("ID de empleado inválido").optional(),
  servicios_ids: z
    .array(z.string().min(1))
    .min(1, "Debes seleccionar al menos un servicio"),
  fecha_hora: z.string().datetime("Formato de fecha inválido (ISO 8601)"),
  anticipo: z.coerce
    .number()
    .min(0, "El anticipo no puede ser negativo")
    .optional(),
});

/**
 * Esquema para EDICIÓN de servicios (Sprint 2).
 * Solo validamos la nueva lista de servicios, el resto de datos se mantiene.
 */
const EditarItemsSchema = z.object({
  servicios_ids: z
    .array(z.string().min(1))
    .min(1, "La cita debe tener al menos un servicio asignado."),
  empleado_id: z.string().optional(),
});
/**
 * Esquema para Cancelar valida el motivo de la cancelacion el motivo
 * */
const CancelarSchema = z.object({
  motivo: z
    .string()
    .min(5, "El motivo de cancelación es obligatorio (mín. 5 caracteres)."),
});
/**
 * Esquema para Cerrar cita, permitiendo asignar empleado al cerrar
 * */
const CloseAppointmentSchema = z.object({
  citaId: z.string().uuid(),
  empleadoId: z.string().optional(), // <--- NUEVO: Permite asignar al cerrar
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
   */
  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    const branch_id = request.branchId ?? "branch-principal";
    const items = await this.appointments_service.listar(branch_id);
    return { items };
  }

  /**
   * POST /appointments
   * Agenda una nueva cita.
   */
  @Post()
  async crear(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos_validos = AgendarSchema.parse(payload);
    return this.appointments_service.agendar(datos_validos, branch_id);
  }

  /**
   * PATCH /appointments/:id/items (NUEVO SPRINT 2)
   * Permite editar los servicios de una cita existente.
   *
   * @param id - ID de la cita a editar.
   * @param payload - JSON con { servicios_ids: [...] }.
   */
  @Patch(":id/items")
  async actualizar_items(
    @Param("id") id: string,
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";

    // Validamos que el payload sea un array de strings válido
    const datos_validos = EditarItemsSchema.parse(payload);

    return this.appointments_service.actualizar_items(
      id,
      datos_validos.servicios_ids,
      branch_id
    );
  }

  /**
   * POST /appointments/:id/cancel
   * Cancela una cita pendiente.
   */
  @Post(":id/cancel")
  async cancelar(
    @Param("id") id: string,
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos = CancelarSchema.parse(payload);

    return this.appointments_service.cancelar(id, datos.motivo, branch_id);
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
    // Validamos con Zod
    const datos = CloseAppointmentSchema.parse(payload);

    return this.appointments_service.cerrar(
      payload.citaId,
      branch_id,
      datos.empleadoId
    );
  }
}
