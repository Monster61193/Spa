import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { inventory_snapshot } from "../common/mocks/sample-data";

/**
 * Servicio de Dominio: Gestión de Inventario.
 * Maneja la existencia de materiales, altas de productos y reabastecimiento.
 */
@Injectable()
export class InventoryService {
  // Logger para ver el error real en la terminal
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista el inventario actual de una sucursal.
   * Incluye lógica de fallback a mocks si la BD no responde.
   */
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

  /**
   * Crea un nuevo material en el catálogo global e inicializa su stock en la sucursal.
   * Utiliza una transacción para asegurar la integridad de los datos.
   *
   * @param data - Datos del material (nombre, unidad, stocks).
   * @param sucursal_id - ID de la sucursal donde se registra.
   */
  async crear_material(
    data: {
      nombre: string;
      unidad: string;
      stock_inicial: number;
      stock_minimo: number;
      costo_unitario?: number;
    },
    sucursal_id: string
  ) {
    // 1. Validación simple de duplicados por nombre (opcional pero recomendada)
    const existente = await this.prisma.material.findFirst({
      where: {
        nombre: { equals: data.nombre, mode: "insensitive" }, // Case insensitive
      },
    });

    if (existente) {
      // En un sistema más complejo, aquí haríamos un "link" a la sucursal.
      // Para este Sprint, lanzamos conflicto para evitar confusiones.
      throw new ConflictException(
        `El material '${data.nombre}' ya existe en el catálogo global.`
      );
    }

    // 2. Transacción de Creación
    return this.prisma.$transaction(async (tx) => {
      // A. Crear el Material (Global)
      const material = await tx.material.create({
        data: {
          nombre: data.nombre,
          unidad: data.unidad,
          costoUnitario: data.costo_unitario ?? 0,
        },
      });

      // B. Crear la Existencia (Local en la Sucursal)
      await tx.existencia.create({
        data: {
          sucursalId: sucursal_id,
          materialId: material.id,
          stockActual: data.stock_inicial,
          stockMinimo: data.stock_minimo,
        },
      });

      // C. Registrar en Auditoría
      await tx.auditLog.create({
        data: {
          entidad: "Inventario",
          accion: "Alta Material",
          sucursalId: sucursal_id,
          descripcion: `Creado: ${data.nombre}. Stock inicial: ${data.stock_inicial} ${data.unidad}`,
        },
      });

      return material;
    });
  }

  /**
   * Registra una entrada de mercancía (Restock).
   * Aumenta el stock actual de forma atómica.
   *
   * @param material_id - UUID del material.
   * @param cantidad - Cantidad a sumar (positiva).
   * @param sucursal_id - ID de la sucursal.
   */
  async reabastecer(
    material_id: string,
    cantidad: number,
    sucursal_id: string
  ) {
    // 1. Verificar que el material exista en esta sucursal
    const existencia = await this.prisma.existencia.findUnique({
      where: {
        sucursalId_materialId: {
          sucursalId: sucursal_id,
          materialId: material_id,
        },
      },
    });

    if (!existencia) {
      throw new NotFoundException(
        "El material no está registrado en el inventario de esta sucursal."
      );
    }

    // 2. Actualización Atómica (Increment)
    // Usamos 'increment' de Prisma para evitar condiciones de carrera
    const actualizado = await this.prisma.existencia.update({
      where: {
        sucursalId_materialId: {
          sucursalId: sucursal_id,
          materialId: material_id,
        },
      },
      data: {
        stockActual: { increment: cantidad },
      },
    });

    // 3. Auditoría de movimiento
    await this.prisma.auditLog.create({
      data: {
        entidad: "Inventario",
        accion: "Reabastecimiento",
        sucursalId: sucursal_id,
        descripcion: `Material ${material_id}: +${cantidad}. Nuevo total: ${actualizado.stockActual}`,
      },
    });

    return Number(actualizado.stockActual);
  }
}
