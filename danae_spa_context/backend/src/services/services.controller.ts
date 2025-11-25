import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { ServicesService } from './services.service'

/**
 * Endpoints para catálogo de servicios del Spa.
 */
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * Retorna el catálogo base (global).
   */
  @Get()
  catalog() {
    return { data: this.servicesService.catalogo() }
  }

  /**
   * Retorna los overrides por sucursal cuando se solicita un servicio específico.
   */
  @Get('overrides')
  overrides(@Query('sucursalId') sucursalId?: string) {
    return { overrides: this.servicesService.overrides(sucursalId) }
  }

  /**
   * Crea un nuevo override para un servicio en una sucursal específica.
   */
  @Post('overrides')
  crearOverride(@Body() payload: { servicioId: string; sucursalId: string; precio: number; duracionMinutos: number }) {
    return this.servicesService.crearOverride(payload)
  }
}
