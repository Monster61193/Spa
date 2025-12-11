import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene la lista de servicios activos.
   */
  async catalogo() {
    const servicios = await this.prisma.servicio.findMany({
      // Nota: Podríamos quitar el filtro 'activo: true' si es para un panel admin
      // Por ahora lo dejamos así, o podrías agregar un flag 'include_inactive'
      orderBy: { nombre: "asc" },
    });

    return servicios.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precioBase: Number(s.precioBase),
      duracionMinutos: s.duracionMinutos,
      activo: s.activo,
    }));
  }

  /**
   * Crea un nuevo servicio en el catálogo.
   * Maneja errores de duplicados (aunque Prisma lo hace, es bueno ser explícito).
   */
  async crear(data: {
    nombre: string;
    descripcion?: string;
    precio_base: number;
    duracion_minutos: number;
    // Tipado nuevo
    materiales?: { material_id: string; cantidad: number }[];
  }) {
    // 1. VALIDACIÓN PREVIA DE MATERIALES (Defensa contra Foreign Key Error)
    if (data.materiales && data.materiales.length > 0) {
      const ids_solicitados = data.materiales.map((m) => m.material_id);

      const count = await this.prisma.material.count({
        where: { id: { in: ids_solicitados } },
      });

      if (count !== ids_solicitados.length) {
        throw new BadRequestException(
          "Uno o más materiales seleccionados en la receta no existen en el sistema. Por favor actualiza tu inventario."
        );
      }
    }
    try {
      return await this.prisma.servicio.create({
        data: {
          nombre: data.nombre,
          descripcion: data.descripcion,
          precioBase: data.precio_base,
          duracionMinutos: data.duracion_minutos,
          activo: true,
          // NUEVO: Inserción anidada (Receta)
          serviciosMateriales: {
            create: data.materiales?.map((m) => ({
              materialId: m.material_id,
              cantidad: m.cantidad,
            })),
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Ya existe un servicio con ese nombre");
      }
      throw error;
    }
  }

  /**
   * Actualiza un servicio existente.
   */
  async actualizar(
    id: string,
    data: {
      nombre?: string;
      descripcion?: string;
      precio_base?: number;
      duracion_minutos?: number;
      activo?: boolean;
    }
  ) {
    // Verificar existencia
    const existe = await this.prisma.servicio.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException("Servicio no encontrado");

    return this.prisma.servicio.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioBase: data.precio_base,
        duracionMinutos: data.duracion_minutos,
        activo: data.activo,
      },
    });
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
   * Crea o actualiza un override.
   */
  async crear_override(payload: any) {
    // TODO: Implementar persistencia real de overrides en Sprint 3
    // Por ahora devolvemos el payload para no romper el contrato
    return { ...payload, activo: true };
  }
}
