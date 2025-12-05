import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/constants/roles";

/**
 * Servicio para la gestión de usuarios y clientes.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos los usuarios registrados que pueden ser clientes.
   * (Por ahora listamos todos, luego podrías filtrar por rol).
   */
  async listar_clientes() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });
    return usuarios;
  }

  /**
   * Lista los empleados asignados a una sucursal específica.
   * Filtra usuarios que tengan un registro en 'Empleado' y una relación
   * con la sucursal solicitada en 'EmpleadoSucursal'.
   *
   * @param sucursal_id - ID de la sucursal activa (extraído del header X-Branch-Id).
   * @returns Lista de empleados con ID, nombre y rol local.
   */
  async listar_empleados(sucursal_id: string) {
    const empleados = await this.prisma.usuario.findMany({
      where: {
        empleado: {
          // Buscamos que tenga relación con la sucursal específica
          sucursales: {
            some: { sucursalId: sucursal_id },
          },
          activo: true, // Solo empleados activos
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        // Incluimos datos específicos del empleado para el frontend
        empleado: {
          select: {
            id: true, // Este es el UUID de la tabla 'empleados' (necesario para comisiones)
            porcentajeComision: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    // Aplanamos la respuesta para facilitar el consumo en el frontend
    return empleados.map((u) => ({
      usuario_id: u.id,
      empleado_id: u.empleado?.id, // ID crítico para la tabla de comisiones
      nombre: u.nombre,
      email: u.email,
    }));
  }
}
