import { Injectable } from '@nestjs/common'
import { services_catalog, services_overrides } from '../common/mocks/sample-data'

/**
 * Servicio para consultar catálogo global y overrides por sucursal.
 */
@Injectable()
export class ServicesService {
  catalogo() {
    return services_catalog
  }

  overrides(sucursalId?: string) {
    if (!sucursalId) {
      return services_overrides
    }
    return services_overrides.filter((override) => override.sucursalId === sucursalId)
  }

  crearOverride(payload: { servicioId: string; sucursalId: string; precio: number; duracionMinutos: number }) {
    // NOTE: In a real implementation, this would save to the database
    console.log('Creating new override with payload:', payload)
    // Here we would add the new override to the services_overrides array or database
    return { ...payload, activo: true }
  }
}
