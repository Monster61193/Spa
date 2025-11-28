import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Servicio para consultar el catálogo de servicios.
 * Gestiona precios base y overrides por sucursal.
 */
@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de servicios activos.
   * Nota: En el futuro, aquí cruzaremos con 'ServiciosSucursal' para obtener
   * el precio específico de la sede, pero por ahora devolvemos el catálogo base.
   */
  async catalogo() {
    const servicios = await this.prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" }, // Orden alfabético para mejor UX
    });

    // Mapeamos para cumplir con el contrato que espera el frontend (camelCase)
    // Aunque Prisma ya devuelve camelCase, aseguramos la estructura.
    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precioBase: Number(s.precioBase), // Decimal -> Number
      duracionMinutos: s.duracionMinutos,
      activo: s.activo,
    }));
  }

  /**
   * Obtiene los overrides configurados para una sucursal.
   */
  async overrides(sucursal_id?: string) {
    if (!sucursal_id) return [];

    return this.prisma.servicioSucursal.findMany({
      where: { sucursalId: sucursal_id },
    });
  }

  /**
   * Crea o actualiza un override de precio/duración.
   */
  async crear_override(payload: {
    servicioId: string;
    sucursalId: string;
    precio: number;
    duracionMinutos: number;
  }) {
    // Implementación futura para Admin
    console.log("TODO: Implementar guardar override", payload);
    return { ...payload, activo: true };
  }
}
