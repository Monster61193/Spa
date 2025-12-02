import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CitaEstado, MovimientoTipo } from "@prisma/client";

/**
 * Servicio encargado de la gestión del ciclo de vida de las citas.
 * Centraliza la lógica de negocio para agendar, consultar y cerrar ventas.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el listado de citas filtrado por sucursal.
   * Utiliza proyección (select) para optimizar la carga de datos.
   *
   * @param sucursal_id - ID de la sucursal activa (header X-Branch-Id).
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

    // Mapeo a un DTO plano para facilitar el consumo en el frontend
    return citas.map((cita) => ({
      id: cita.id,
      fechaHora: cita.fechaHora,
      estado: cita.estado,
      // Manejo seguro de nulos (Nullish Coalescing)
      cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
      servicio: cita.servicio?.nombre ?? "Servicio Eliminado",
      total: Number(cita.total),
    }));
  }

  /**
   * Agenda una nueva cita en estado 'pendiente'.
   * Valida la existencia del servicio base antes de crear.
   *
   * @param data - Datos validados del formulario.
   * @param sucursal_id - ID de la sucursal activa.
   */
  async agendar(
    data: { usuario_id: string; servicio_id: string; fecha_hora: string },
    sucursal_id: string
  ) {
    // 1. Validar que el servicio exista y obtener su precio base
    const servicio = await this.prisma.servicio.findUnique({
      where: { id: data.servicio_id },
    });

    if (!servicio) {
      throw new BadRequestException(
        "El servicio solicitado no existe en el catálogo global."
      );
    }

    // Nota Senior: Aquí podríamos agregar una validación de "disponibilidad" (overlap)
    // en una futura iteración (Roadmap P1).

    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        servicioId: data.servicio_id,
        fechaHora: new Date(data.fecha_hora),
        estado: CitaEstado.pendiente,
        total: servicio.precioBase, // Precio base inicial
      },
    });
  }

  /**
   * Cierra una cita ejecutando todas las reglas de negocio de forma atómica.
   * * Flujo Transaccional (ACID):
   * 1. Validación de seguridad (Sucursal y Estado).
   * 2. Descuento de stock en tiempo real con validación de saldos negativos.
   * 3. Generación de puntos de lealtad (5% del total).
   * 4. Cálculo de comisiones para el empleado.
   * 5. Auditoría del evento (Compliance).
   * * @param cita_id - UUID de la cita a cerrar.
   * @param sucursal_id - UUID de la sucursal contexto.
   */
  async cerrar(cita_id: string, sucursal_id: string) {
    // Iniciamos una transacción: Todo tiene que salir bien o nada se guarda.
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener la cita con bloqueo y relaciones
      const cita_encontrada = await tx.cita.findUnique({
        where: { id: cita_id },
        include: {
          servicio: {
            include: {
              serviciosMateriales: true, // Receta para descontar inventario
            },
          },
          empleado: true,
          usuario: true,
        },
      });

      // --- VALIDACIONES DEFENSIVAS ---
      if (!cita_encontrada) {
        throw new NotFoundException("Cita no encontrada.");
      }

      // Regla de Seguridad Multi-sucursal [AGENTS.md]
      if (cita_encontrada.sucursalId !== sucursal_id) {
        throw new BadRequestException(
          "Violación de acceso: La cita no pertenece a la sucursal activa."
        );
      }

      // Regla de Idempotencia
      if (cita_encontrada.estado === CitaEstado.cerrada) {
        throw new ConflictException("Esta cita ya fue cerrada previamente.");
      }

      const total_pagado = Number(cita_encontrada.total);

      // --- 2. INVENTARIO (Gestión de Stock) ---
      if (cita_encontrada.servicio?.serviciosMateriales) {
        for (const insumo of cita_encontrada.servicio.serviciosMateriales) {
          // Buscar existencia EN ESTA SUCURSAL (Scope local)
          const existencia = await tx.existencia.findUnique({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
          });

          if (!existencia) {
            // Regla: No permitir cierre si no está configurado el inventario local
            throw new ConflictException(
              `Error de configuración: El material ${insumo.materialId} no tiene registro en esta sucursal.`
            );
          }

          // Regla: Bloquear stock negativo (Inventory Rules Opción A)
          if (Number(existencia.stockActual) < Number(insumo.cantidad)) {
            throw new ConflictException(
              `Stock insuficiente para '${insumo.materialId}'. Requerido: ${insumo.cantidad}, Actual: ${existencia.stockActual}`
            );
          }

          // Ejecutar descuento
          await tx.existencia.update({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
            data: { stockActual: { decrement: insumo.cantidad } },
          });
        }
      }

      // --- 3. PUNTOS (Lealtad) ---
      // Regla: 5% del total como puntos (floor para enteros)
      const puntos_ganados = Math.floor(total_pagado * 0.05);

      if (cita_encontrada.usuarioId && puntos_ganados > 0) {
        await tx.puntosMovimiento.create({
          data: {
            usuarioId: cita_encontrada.usuarioId,
            sucursalId: sucursal_id,
            citaId: cita_encontrada.id,
            tipo: MovimientoTipo.earn,
            cantidad: puntos_ganados,
            fecha: new Date(),
          },
        });
      }

      // --- 4. COMISIONES (Nómina) ---
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
              generadoEn: new Date(),
            },
          });
        }
      }

      // --- 5. CIERRE FINAL ---
      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cerrada },
      });

      // --- 6. AUDITORÍA (Logs) ---
      // Registro en tabla 'audit_log' para trazabilidad completa
      await tx.auditLog.create({
        data: {
          entidad: "Cita",
          accion: "Cierre",
          sucursalId: sucursal_id,
          usuarioId: cita_encontrada.usuarioId, // Cliente afectado
          descripcion: `Cita ${cita_id} cerrada. Total: $${total_pagado}`,
          metadata: {
            puntos_generados: puntos_ganados,
            items_inventario:
              cita_encontrada.servicio?.serviciosMateriales.length ?? 0,
          },
        },
      });

      return {
        ...cita_actualizada,
        mensaje:
          "Cita cerrada correctamente. Inventario, puntos y comisiones procesados.",
      };
    });
  }
}
