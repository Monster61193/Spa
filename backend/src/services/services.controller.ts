import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ServicesService } from "./services.service";

/**
 * Endpoints para catálogo de servicios del Spa.
 */
@Controller("services")
export class ServicesController {
  constructor(private readonly services_service: ServicesService) {}

  /**
   * Retorna el catálogo base de servicios activos.
   * GET /api/services
   */
  @Get()
  async catalog() {
    const items = await this.services_service.catalogo();
    return { items };
  }

  /**
   * Retorna los overrides por sucursal.
   */
  @Get("overrides")
  async overrides(@Query("sucursalId") sucursal_id?: string) {
    const overrides = await this.services_service.overrides(sucursal_id);
    return { overrides };
  }

  /**
   * Crea un nuevo override.
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
