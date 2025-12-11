import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { AppointmentsService } from "./appointments.service";
import { z } from "zod";

/**
 * Helper para limpiar IDs opcionales que vienen de formularios.
 * Convierte "", null, o "null" en undefined para que Zod lo ignore.
 */
const optionalUuidSchema = z.preprocess((val) => {
  if (val === "" || val === null || val === "null") return undefined;
  return val;
}, z.string().uuid().optional());

// --- ESQUEMAS ---

const AgendarSchema = z.object({
  usuario_id: z.string().min(1),
  empleado_id: optionalUuidSchema,
  servicios_ids: z.array(z.string().min(1)).min(1),
  fecha_hora: z.string().datetime(),
  anticipo: z.coerce.number().min(0).optional(),
});

const EditarItemsSchema = z.object({
  servicios_ids: z.array(z.string().min(1)).min(1),
  empleado_id: z.string().optional(),
});

const CancelarSchema = z.object({
  motivo: z.string().min(5),
});

const CloseAppointmentSchema = z.object({
  // Permitimos cualquier string no vacío para el ID de la cita
  citaId: z.string().min(1),

  // Empleado: Limpieza de string vacío -> undefined
  empleadoId: z.preprocess(
    (val) => (val === "" || val === "null" ? undefined : val),
    z.string().optional() // <--- Quitamos .uuid()
  ),

  // Promo: Limpieza de string vacío -> undefined
  promoId: z.preprocess(
    (val) => (val === "" || val === "null" ? undefined : val),
    z.string().optional() // <--- Quitamos .uuid()
  ),
});

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments_service: AppointmentsService) {}

  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    const branch_id = request.branchId ?? "branch-principal";
    const items = await this.appointments_service.listar(branch_id);
    return { items };
  }

  @Post()
  async crear(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos = AgendarSchema.parse(payload);
    return this.appointments_service.agendar(datos, branch_id);
  }

  @Patch(":id/items")
  async actualizar_items(
    @Param("id") id: string,
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos = EditarItemsSchema.parse(payload);
    return this.appointments_service.actualizar_items(
      id,
      datos.servicios_ids,
      branch_id,
      datos.empleado_id
    );
  }

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

  @Post("close")
  async cerrar(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";

    // --- DEBUGGING (Muestra en consola qué llega exactamente) ---
    console.log(
      "📥 Payload recibido en /close:",
      JSON.stringify(payload, null, 2)
    );

    const datos = CloseAppointmentSchema.parse(payload);

    return this.appointments_service.cerrar(
      datos.citaId,
      branch_id,
      datos.empleadoId,
      datos.promoId
    );
  }
}
