import {
  Injectable,
  NotFoundException,
  ConflictException,
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
        // Mapeo condicional: solo si viene el dato
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
