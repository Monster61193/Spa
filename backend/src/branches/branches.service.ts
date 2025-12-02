import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { branches as sample_branches } from "../common/mocks/sample-data";

/**
 * Servicio de sucursales con tolerancia a fallos.
 * Intenta leer de DB, pero hace fallback a mocks si hay problemas de conexión.
 */
@Injectable()
export class BranchesService {
  // Logger para ver el error real en la terminal del servidor
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    try {
      // 1. Intentamos consultar la base de datos real
      const stored = await this.prisma.sucursal.findMany({ take: 5 });

      // Si la consulta es exitosa y hay datos, los usamos
      if (stored.length > 0) {
        return stored;
      }

      // Si la tabla existe pero está vacía, avisamos y usamos mocks para no romper el UI
      this.logger.warn(
        "La tabla Sucursales está vacía. Usando datos de prueba."
      );
      return sample_branches;
    } catch (error) {
      // 2. MANEJO DE ERRORES (CATCH)
      // Si Prisma falla (ej. DB apagada, password mal), capturamos el error aquí.

      this.logger.error("🔥 Error crítico conectando a Base de Datos:", error);

      // FALLBACK: Devolvemos los mocks para que el Frontend pueda cargar
      // Esto "salva" la aplicación en desarrollo.
      return sample_branches;
    }
  }
}
