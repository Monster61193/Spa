import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Servicio de gestión de campañas y promociones.
 * Aplica reglas de vigencia temporal y alcance (Global vs Local).
 */
@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista las promociones activas y vigentes para una sucursal.
   * Regla de Negocio:
   * 1. Estado = true
   * 2. Fecha actual dentro del rango [inicio, fin]
   * 3. Scope: Es global (sucursalId null) O pertenece a esta sucursal.
   *
   * @param sucursal_id - ID de la sucursal activa (opcional, si no viene trae solo globales).
   */
  async listar(sucursal_id?: string) {
    const hoy = new Date();

    const promociones = await this.prisma.promocion.findMany({
      where: {
        estado: true, // Solo activas
        fechaInicio: { lte: hoy }, // Ya empezaron
        fechaFin: { gte: hoy }, // No han terminado
        OR: [
          { sucursalId: null }, // Promociones Globales (Cadena)
          { sucursalId: sucursal_id }, // Promociones Locales
        ],
      },
      orderBy: {
        descuento: "desc", // Mostrar las mejores ofertas primero
      },
    });

    // Mapeo simple (aunque Prisma ya devuelve el objeto correcto, aseguramos tipos)
    return promociones.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descuento: Number(p.descuento), // Decimal -> Number
      vigente: true, // Implícito por el filtro
      alcance: p.sucursalId ? "Local" : "Global",
    }));
  }
}
