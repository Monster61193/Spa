import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ServicesService } from "./services.service";
import { z } from "zod";

/**
 * Esquema para CREAR un nuevo servicio global.
 */
const MaterialRecipeSchema = z.object({
  material_id: z.string(),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
});

const CreateServiceSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
  precio_base: z.coerce.number().min(0),
  duracion_minutos: z.coerce.number().int().positive(),
  // NUEVO: Array opcional de materiales
  materiales: z.array(MaterialRecipeSchema).optional(),
});

/**
 * Esquema para ACTUALIZAR un servicio (parcial).
 */
const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  activo: z.boolean().optional(),
});

/**
 * Endpoints para gestión del catálogo de servicios.
 */
@Controller("services")
export class ServicesController {
  constructor(private readonly services_service: ServicesService) {}

  /**
   * GET /services
   * Retorna el catálogo base de servicios activos.
   */
  @Get()
  async catalog() {
    const items = await this.services_service.catalogo();
    return { items };
  }

  /**
   * POST /services (NUEVO)
   * Crea un nuevo servicio en el catálogo global.
   */
  @Post()
  async crear(@Body() payload: unknown) {
    // 1. Validar y transformar payload
    const datos = CreateServiceSchema.parse(payload);

    // 2. Llamar al servicio
    const nuevo_servicio = await this.services_service.crear(datos);
    return { item: nuevo_servicio, mensaje: "Servicio creado correctamente" };
  }

  /**
   * PATCH /services/:id (NUEVO)
   * Actualiza precio, nombre o estado de un servicio.
   */
  @Patch(":id")
  async actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() payload: unknown
  ) {
    const datos = UpdateServiceSchema.parse(payload);
    const servicio_actualizado = await this.services_service.actualizar(
      id,
      datos
    );
    return { item: servicio_actualizado, mensaje: "Servicio actualizado" };
  }

  /**
   * GET /services/overrides
   * Retorna los overrides por sucursal.
   */
  @Get("overrides")
  async overrides(@Query("sucursalId") sucursal_id?: string) {
    const overrides = await this.services_service.overrides(sucursal_id);
    return { overrides };
  }

  /**
   * POST /services/overrides
   * Crea un nuevo override (precio específico por sucursal).
   */
  @Post("overrides")
  crear_override(
    @Body()
    payload: {
      servicioId: string;
      sucursalId: string;
      precio: number;
      duracionMinutos: number;
    }
  ) {
    return this.services_service.crear_override(payload);
  }
}
