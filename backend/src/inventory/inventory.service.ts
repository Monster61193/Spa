import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { inventory_snapshot } from "../common/mocks/sample-data";

@Injectable()
export class InventoryService {
  // Logger para ver el error real en la terminal
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursal_id: string) {
    try {
      // 1. Intentamos leer de la Base de Datos Real
      const existencias = await this.prisma.existencia.findMany({
        where: { sucursalId: sucursal_id },
        include: { material: true },
        orderBy: { material: { nombre: "asc" } },
      });

      // Si la base de datos responde y tiene datos, los usamos
      if (existencias.length > 0) {
        return existencias.map((item) => ({
          materialId: item.materialId,
          material: item.material.nombre,
          unidad: item.material.unidad,
          stockActual: Number(item.stockActual),
          stockMinimo: Number(item.stockMinimo),
          alerta: Number(item.stockActual) <= Number(item.stockMinimo),
        }));
      }

      // Si conecta pero está vacía, probamos con el fallback
      this.logger.warn(
        `Inventario vacío en BD para ${sucursal_id}. Buscando mocks...`
      );
    } catch (error) {
      // 2. FALLBACK DE SEGURIDAD
      // Si la conexión a la BD falla (Error de conexión, password, etc.)
      this.logger.error(
        "🔥 Error leyendo inventario de BD. Usando datos Mock.",
        error
      );
    }

    // 3. Devolver Mocks (Si falló la BD o estaba vacía)
    // Mapeamos los datos crudos del mock al formato DTO esperado
    const mockData = inventory_snapshot[sucursal_id] || [];

    return mockData.map((item: any) => ({
      materialId: `mock-${item.material}`,
      material: item.material,
      unidad: "unidades", // Valor default para mocks
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      alerta: item.stockActual <= item.stockMinimo,
    }));
  }
}
