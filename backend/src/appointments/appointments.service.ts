import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CitaEstado, MovimientoTipo } from "@prisma/client";

/**
 * Servicio de Dominio: Gestión de Citas (Appointments).
 * -----------------------------------------------------------------------------
 * Centraliza la lógica transaccional para el ciclo de vida de la cita:
 * Agendar -> Validar -> Cerrar (Venta).
 *
 * Actualizado para SPRINT 1: Soporte de Múltiples Servicios por Cita.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista las citas de una sucursal, formateando la respuesta para el Frontend.
   *
   * CAMBIO SPRINT 1:
   * Ahora concatena los nombres de los múltiples servicios en un solo string
   * para mantener la compatibilidad visual con la tabla actual.
   *
   * @param sucursal_id - ID de la sucursal activa (header X-Branch-Id).
   * @returns Lista de citas con detalles planos.
   */
  async listar(sucursal_id: string) {
    // BLOQUE 1: Consulta Optimizada
    const citas_db = await this.prisma.cita.findMany({
      where: { sucursalId: sucursal_id },
      orderBy: { fechaHora: "asc" },
      include: {
        usuario: {
          select: { nombre: true, email: true },
        },
        // Relación 1:N actualizada
        servicios: {
          include: {
            servicio: {
              select: { nombre: true, duracionMinutos: true },
            },
          },
        },
      },
    });

    // BLOQUE 2: Transformación de Datos (DTO)
    return citas_db.map((cita) => {
      // Lógica de presentación: Unir nombres de servicios (ej: "Manicure, Pedicure")
      const lista_servicios = cita.servicios
        .map((item) => item.servicio.nombre)
        .join(", ");

      return {
        id: cita.id,
        fechaHora: cita.fechaHora,
        estado: cita.estado,
        cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
        // Si no hay servicios, mostramos un texto por defecto
        servicio: lista_servicios || "Sin servicios asignados",
        total: Number(cita.total),
      };
    });
  }

  /**
   * Crea una nueva cita con múltiples servicios.
   *
   * CAMBIO SPRINT 1:
   * - Recibe un array de IDs (`servicios_ids`).
   * - Calcula el total sumando los precios individuales.
   * - Crea los registros en la tabla intermedia `CitaServicio` en una sola transacción.
   *
   * @param data - DTO con usuario, lista de servicios y fecha.
   * @param sucursal_id - ID de la sucursal donde se agendará.
   */
  async agendar(
    data: { usuario_id: string; servicios_ids: string[]; fecha_hora: string },
    sucursal_id: string
  ) {
    // BLOQUE 1: Validación de Catálogo
    // Buscamos todos los servicios solicitados para asegurar que existen
    // y para obtener sus precios actuales.
    const servicios_encontrados = await this.prisma.servicio.findMany({
      where: {
        id: { in: data.servicios_ids },
        activo: true, // Solo permitimos agendar servicios activos
      },
    });

    // Validación: ¿Encontramos todos los servicios que pidió el usuario?
    if (servicios_encontrados.length !== data.servicios_ids.length) {
      throw new BadRequestException(
        "Uno o más servicios solicitados no existen o están inactivos."
      );
    }

    // BLOQUE 2: Cálculo Financiero
    // Sumamos el precio base de todos los servicios encontrados.
    const total_calculado = servicios_encontrados.reduce(
      (suma, servicio) => suma + Number(servicio.precioBase),
      0
    );

    // BLOQUE 3: Persistencia (Escritura)
    // Usamos 'nested writes' de Prisma para crear la Cita y sus relaciones CitaServicio
    // atómicamente.
    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        fechaHora: new Date(data.fecha_hora),
        estado: CitaEstado.pendiente,
        total: total_calculado,
        // Magia de Prisma: Creamos las filas intermedias aquí mismo
        servicios: {
          create: servicios_encontrados.map((servicio) => ({
            servicioId: servicio.id,
            precio: servicio.precioBase, // Snapshot del precio al momento de venta
          })),
        },
      },
    });
  }

  /**
   * Cierra una cita (Proceso de Venta).
   *
   * LÓGICA COMPLEJA (Sprint 1 Update):
   * 1. Itera sobre CADA servicio de la cita.
   * 2. Por cada servicio, busca su receta de materiales.
   * 3. Descuenta del inventario local la cantidad necesaria.
   * 4. Si falta material para CUALQUIER servicio, revierte todo (Atomicidad).
   *
   * @param cita_id - UUID de la cita.
   * @param sucursal_id - UUID de la sucursal (Contexto de seguridad).
   */
  async cerrar(cita_id: string, sucursal_id: string) {
    // Iniciamos transacción interactiva para asegurar ACID
    return this.prisma.$transaction(async (tx) => {
      // BLOQUE 1: Obtención de Datos Profunda
      // Necesitamos la Cita -> Servicios -> Definición Servicio -> Receta Materiales
      const cita_completa = await tx.cita.findUnique({
        where: { id: cita_id },
        include: {
          servicios: {
            include: {
              servicio: {
                include: {
                  serviciosMateriales: true, // Receta (BOM)
                },
              },
            },
          },
          empleado: true,
          usuario: true,
        },
      });

      // BLOQUE 2: Validaciones de Negocio (Guard Clauses)
      if (!cita_completa) {
        throw new NotFoundException("La cita no existe.");
      }
      // Seguridad Multi-tenancy
      if (cita_completa.sucursalId !== sucursal_id) {
        throw new BadRequestException(
          "Error de seguridad: La cita no pertenece a la sucursal activa."
        );
      }
      // Idempotencia
      if (cita_completa.estado === CitaEstado.cerrada) {
        throw new ConflictException("La cita ya fue cerrada previamente.");
      }

      const monto_total = Number(cita_completa.total);

      // BLOQUE 3: Procesamiento de Inventario (Multi-Servicio)
      // Iteramos sobre cada servicio contratado en la cita
      for (const item_venta of cita_completa.servicios) {
        const receta = item_venta.servicio.serviciosMateriales;

        // Por cada material que requiere este servicio...
        for (const insumo of receta) {
          // Buscamos si existe stock en ESTA sucursal
          const existencia_actual = await tx.existencia.findUnique({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
          });

          // Validación estricta de configuración
          if (!existencia_actual) {
            throw new ConflictException(
              `Error de configuración: El material '${insumo.materialId}' (requerido por ${item_venta.servicio.nombre}) no está dado de alta en el inventario de esta sucursal.`
            );
          }

          // Validación de Stock Suficiente
          if (Number(existencia_actual.stockActual) < Number(insumo.cantidad)) {
            throw new ConflictException(
              `Stock insuficiente: No hay suficiente '${insumo.materialId}' para realizar el servicio '${item_venta.servicio.nombre}'. Requerido: ${insumo.cantidad}, Disponible: ${existencia_actual.stockActual}`
            );
          }

          // Ejecución del Descuento
          await tx.existencia.update({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
            data: {
              stockActual: { decrement: insumo.cantidad },
            },
          });
        }
      }

      // BLOQUE 4: Fidelización (Puntos)
      // Regla: 5% del monto total se abona como puntos
      const puntos_a_otorgar = Math.floor(monto_total * 0.05);

      if (cita_completa.usuarioId && puntos_a_otorgar > 0) {
        await tx.puntosMovimiento.create({
          data: {
            usuarioId: cita_completa.usuarioId,
            sucursalId: sucursal_id,
            citaId: cita_completa.id,
            tipo: MovimientoTipo.earn,
            cantidad: puntos_a_otorgar,
            fecha: new Date(),
          },
        });
      }

      // BLOQUE 5: Nómina (Comisiones)
      if (cita_completa.empleado) {
        const pct_comision = Number(cita_completa.empleado.porcentajeComision);
        const monto_comision = monto_total * (pct_comision / 100);

        if (monto_comision > 0) {
          await tx.comision.create({
            data: {
              empleadoId: cita_completa.empleado.id,
              citaId: cita_completa.id,
              porcentaje: pct_comision,
              monto: monto_comision,
            },
          });
        }
      }

      // BLOQUE 6: Cierre y Auditoría
      // Actualizamos el estado de la cita
      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cerrada },
      });

      // Generamos rastro de auditoría (Observabilidad)
      await tx.auditLog.create({
        data: {
          entidad: "Cita",
          accion: "Cierre",
          sucursalId: sucursal_id,
          usuarioId: cita_completa.usuarioId,
          descripcion: `Cierre de venta multi-servicio. Total: $${monto_total}`,
          metadata: {
            servicios_procesados: cita_completa.servicios.length,
            puntos_generados: puntos_a_otorgar,
          },
        },
      });

      return {
        ...cita_actualizada,
        mensaje:
          "Venta procesada correctamente. Inventario actualizado y puntos asignados.",
      };
    });
  }
}
