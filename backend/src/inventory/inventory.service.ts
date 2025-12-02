import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Servicio de Inventario Real.
 * Consulta las existencias directamente de la base de datos.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el snapshot del inventario para una sucursal específica.
   * Mapea los datos de Prisma al formato que espera el frontend.
   * * @param sucursal_id - ID de la sucursal activa.
   */
  async listar(sucursal_id: string) {
    // 1. Consulta a la BD (JOIN con Materiales para obtener el nombre)
    const existencias = await this.prisma.existencia.findMany({
      where: { sucursalId: sucursal_id },
      include: {
        material: true, // Traemos el nombre y unidad del material
      },
      orderBy: {
        material: { nombre: "asc" },
      },
    });

    // 2. Transformación de datos (DTO)
    return existencias.map((item) => ({
      materialId: item.materialId,
      material: item.material.nombre,
      unidad: item.material.unidad,
      stockActual: Number(item.stockActual), // Convertimos Decimal a Number
      stockMinimo: Number(item.stockMinimo),
      // Calculamos si está bajo de stock para el frontend
      alerta: Number(item.stockActual) <= Number(item.stockMinimo),
    }));
  }
}
