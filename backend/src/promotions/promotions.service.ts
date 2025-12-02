import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Servicio de Negocio: Gestión de Campañas y Promociones.
 * -----------------------------------------------------------------------------
 * Se encarga de filtrar y servir las promociones aplicables según el contexto.
 */
@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista las promociones válidas para el momento y lugar actual.
   * * **Reglas de Negocio aplicadas:**
   * 1. **Estado:** La promoción debe estar activa (`estado: true`).
   * 2. **Vigencia:** La fecha actual debe estar dentro del rango [Inicio, Fin].
   * 3. **Alcance:** * - Global: `sucursalId` es null (Aplica a toda la cadena).
   * - Local: `sucursalId` coincide con la sucursal que consulta.
   * * @param sucursal_id - ID de la sucursal activa (opcional).
   * @returns Lista de promociones filtradas y formateadas.
   */
  async listar(sucursal_id?: string) {
    // Capturamos el momento exacto para comparar vigencia
    const fecha_actual = new Date();

    // BLOQUE 1: Consulta con Filtros Complejos (WHERE)
    const promociones_db = await this.prisma.promocion.findMany({
      where: {
        estado: true, // Solo activas
        // Lógica de fechas: Inicio <= Hoy <= Fin
        fechaInicio: { lte: fecha_actual },
        fechaFin: { gte: fecha_actual },
        // Lógica de alcance (OR): Es global O es de mi sucursal
        OR: [{ sucursalId: null }, { sucursalId: sucursal_id }],
      },
      // Ordenamos por descuento descendente (mejores ofertas primero)
      orderBy: {
        descuento: "desc",
      },
    });

    // BLOQUE 2: Mapeo de Respuesta
    // Transformamos los tipos de DB (ej. Decimal) a tipos JS nativos (Number).
    return promociones_db.map((promo) => ({
      id: promo.id,
      nombre: promo.nombre,
      // Conversión explícita de Decimal de Prisma a Number de JS
      descuento: Number(promo.descuento),
      vigente: true, // Implícito por el filtro de fechas
      // Campo calculado para informar al frontend el origen de la promo
      alcance: promo.sucursalId ? "Local" : "Global",
    }));
  }
}
