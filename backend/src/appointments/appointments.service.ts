import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CitaEstado } from "@prisma/client";

/**
 * Servicio encargado de la gestión del ciclo de vida de las citas.
 * Conecta con la base de datos para persistir agendamientos y cierres.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el listado de citas filtrado por sucursal.
   * Incluye las relaciones necesarias (Cliente, Servicio) para mostrar en la UI.
   *
   * @param sucursal_id - Identificador de la sucursal activa (contexto).
   */
  async listar(sucursal_id: string) {
    const citas = await this.prisma.cita.findMany({
      where: {
        sucursalId: sucursal_id,
      },
      orderBy: {
        fechaHora: "asc",
      },
      include: {
        usuario: {
          // Obtenemos datos del cliente
          select: { nombre: true, email: true },
        },
        servicio: {
          // Obtenemos datos del servicio
          select: { nombre: true, duracionMinutos: true },
        },
      },
    });

    // Mapeamos la respuesta para aplanar la estructura y facilitar el consumo en el frontend
    return citas.map((cita) => ({
      id: cita.id,
      fechaHora: cita.fechaHora,
      estado: cita.estado,
      // Usamos el operador ?? para manejar posibles nulos si se borró el usuario/servicio
      cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
      servicio: cita.servicio?.nombre ?? "Servicio Eliminado",
      total: Number(cita.total), // Prisma devuelve Decimal, lo convertimos a Number para JS
    }));
  }

  /**
   * Crea una nueva cita en estado 'pendiente'.
   *
   * @param data - Datos de la cita (usuario, servicio, fecha).
   * @param sucursal_id - Sucursal donde se agenda.
   */
  async agendar(
    data: { usuario_id: string; servicio_id: string; fecha_hora: string },
    sucursal_id: string
  ) {
    // 1. Validar que el servicio exista y obtener su precio base
    // Nota: A futuro aquí buscaremos si hay un "override" de precio por sucursal
    const servicio = await this.prisma.servicio.findUnique({
      where: { id: data.servicio_id },
    });

    if (!servicio) {
      throw new BadRequestException("El servicio solicitado no existe");
    }

    // 2. Crear la cita en la BD
    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        servicioId: data.servicio_id,
        fechaHora: new Date(data.fecha_hora),
        estado: CitaEstado.pendiente,
        total: servicio.precioBase, // Guardamos el precio base como inicial
      },
    });
  }

  /**
   * Cierra una cita y ejecuta la lógica de negocio (Inventario, Puntos, Comisiones).
   * (Placeholder: La implementación completa del cierre la haremos en la siguiente iteración).
   */
  async cerrar(cita_id: string, sucursal_id: string) {
    return {
      id: cita_id,
      sucursal_id,
      estado: "cerrada",
      mensaje: "Lógica de cierre pendiente de implementar",
    };
  }
}
