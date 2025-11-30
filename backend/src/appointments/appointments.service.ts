import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CitaEstado, MovimientoTipo } from "@prisma/client";

/**
 * Servicio encargado de la gestión del ciclo de vida de las citas.
 * Maneja la lógica transaccional crítica: Agendar -> Cerrar.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el listado de citas filtrado por sucursal.
   */
  async listar(sucursal_id: string) {
    const citas = await this.prisma.cita.findMany({
      where: { sucursalId: sucursal_id },
      orderBy: { fechaHora: "asc" },
      include: {
        usuario: { select: { nombre: true, email: true } },
        servicio: { select: { nombre: true, duracionMinutos: true } },
      },
    });

    return citas.map((cita) => ({
      id: cita.id,
      fechaHora: cita.fechaHora,
      estado: cita.estado,
      cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
      servicio: cita.servicio?.nombre ?? "Servicio Eliminado",
      total: Number(cita.total),
    }));
  }

  /**
   * Crea una nueva cita en estado 'pendiente'.
   */
  async agendar(
    data: { usuario_id: string; servicio_id: string; fecha_hora: string },
    sucursal_id: string
  ) {
    const servicio = await this.prisma.servicio.findUnique({
      where: { id: data.servicio_id },
    });

    if (!servicio) {
      throw new BadRequestException("El servicio solicitado no existe");
    }

    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        servicioId: data.servicio_id,
        fechaHora: new Date(data.fecha_hora),
        estado: CitaEstado.pendiente,
        total: servicio.precioBase,
      },
    });
  }

  /**
   * Cierra una cita y ejecuta la lógica de negocio compleja (Transacción).
   * 1. Valida estado.
   * 2. Descuenta inventario (si el servicio tiene receta de materiales).
   * 3. Genera puntos de lealtad para el cliente.
   * 4. Calcula comisiones para el empleado (si existe).
   * 5. Actualiza estado a 'cerrada'.
   */
  async cerrar(cita_id: string, sucursal_id: string) {
    // Iniciamos una transacción: Todo tiene que salir bien o nada se guarda.
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener la cita con todas sus relaciones necesarias
      const cita_encontrada = await tx.cita.findUnique({
        where: { id: cita_id },
        include: {
          servicio: {
            include: {
              serviciosMateriales: true, // Necesario para saber qué descontar
            },
          },
          empleado: true,
          usuario: true,
        },
      });

      // Validaciones Previas
      if (!cita_encontrada) throw new NotFoundException("Cita no encontrada");
      if (cita_encontrada.sucursalId !== sucursal_id)
        throw new BadRequestException("La cita no pertenece a esta sucursal");
      if (cita_encontrada.estado === CitaEstado.cerrada)
        throw new BadRequestException("Esta cita ya fue cerrada");

      const total_pagado = Number(cita_encontrada.total);

      // 2. Inventario: Descontar materiales
      if (
        cita_encontrada.servicio &&
        cita_encontrada.servicio.serviciosMateriales.length > 0
      ) {
        for (const insumo of cita_encontrada.servicio.serviciosMateriales) {
          // Buscamos si existe stock en esta sucursal
          const existencia = await tx.existencia.findUnique({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
          });

          if (existencia) {
            await tx.existencia.update({
              where: {
                sucursalId_materialId: {
                  sucursalId: sucursal_id,
                  materialId: insumo.materialId,
                },
              },
              data: { stockActual: { decrement: insumo.cantidad } },
            });
          } else {
            console.warn(
              `⚠️ No se encontró registro de existencia para material ${insumo.materialId} en sucursal ${sucursal_id}`
            );
          }
        }
      }

      // 3. Puntos: Abonar al cliente (Regla: 5% del total como puntos)
      const puntos_ganados = Math.floor(total_pagado * 0.05);

      if (cita_encontrada.usuarioId && puntos_ganados > 0) {
        await tx.puntosMovimiento.create({
          data: {
            usuarioId: cita_encontrada.usuarioId,
            sucursalId: sucursal_id,
            citaId: cita_encontrada.id,
            tipo: MovimientoTipo.earn,
            cantidad: puntos_ganados,
          },
        });
      }

      // 4. Comisiones: Si hay empleado asignado
      if (cita_encontrada.empleado) {
        const porcentaje = Number(cita_encontrada.empleado.porcentajeComision);
        const monto_comision = total_pagado * (porcentaje / 100);

        if (monto_comision > 0) {
          await tx.comision.create({
            data: {
              empleadoId: cita_encontrada.empleado.id,
              citaId: cita_encontrada.id,
              porcentaje: porcentaje,
              monto: monto_comision,
            },
          });
        }
      }

      // 5. Finalizar: Actualizar estado de la cita
      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cerrada },
      });

      return {
        ...cita_actualizada,
        mensaje:
          "Cita cerrada exitosamente. Inventario, puntos y comisiones procesados.",
      };
    });
  }
}
