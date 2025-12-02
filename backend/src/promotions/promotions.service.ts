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
   * Reglas de Negocio:
   * 1. Estado activo (true).
   * 2. Fecha actual dentro del rango [inicio, fin].
   * 3. Alcance: Es global (sucursalId null) O pertenece específicamente a esta sucursal.
   *
   * @param sucursal_id - ID de la sucursal activa (opcional).
   */
  async listar(sucursal_id?: string) {
    const hoy = new Date();

    const promociones = await this.prisma.promocion.findMany({
      where: {
        estado: true, // Solo activas
        fechaInicio: { lte: hoy }, // Que ya hayan empezado
        fechaFin: { gte: hoy }, // Que no hayan terminado
        OR: [
          { sucursalId: null }, // Promociones Globales (toda la cadena)
          { sucursalId: sucursal_id }, // Promociones Locales (solo esta sede)
        ],
      },
      orderBy: {
        descuento: "desc", // Mostrar las mejores ofertas primero
      },
    });

    // Mapeo de respuesta
    return promociones.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descuento: Number(p.descuento), // Convertimos Decimal a Number JS
      vigente: true,
      alcance: p.sucursalId ? "Local" : "Global",
    }));
  }
}
