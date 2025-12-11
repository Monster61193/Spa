import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CitaEstado, MovimientoTipo } from "@prisma/client";
// Importamos el servicio de promociones para usar su motor de validación
import { PromotionsService } from "../promotions/promotions.service";

/**
 * Servicio de Dominio: Gestión de Citas (Appointments).
 * Centraliza la lógica transaccional para el ciclo de vida de la cita, incluyendo
 * la orquestación de inventario, puntos, comisiones y promociones.
 */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    // Inyectamos el servicio de promociones
    private readonly promotions_service: PromotionsService
  ) {}

  /**
   * Lista las citas de una sucursal con datos enriquecidos para la UI.
   *
   * Lógica Transaccional:
   * 1. Consulta las citas de la sucursal ordenadas por fecha junto con usuario, empleado y servicios relacionados.
   * 2. Construye cadenas de presentación para servicios y empleado, aplicando valores por defecto cuando falten relaciones.
   * 3. Mapea cada cita a un DTO plano que incluye totales, metadatos para edición y campos de visualización.
   *
   * @param sucursal_id - ID de la sucursal utilizada para filtrar las citas visibles.
   * @returns Arreglo de objetos listos para renderizar en la tabla de citas del frontend.
   */
  async listar(sucursal_id: string) {
    const citas_db = await this.prisma.cita.findMany({
      where: { sucursalId: sucursal_id },
      orderBy: { fechaHora: "asc" },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        empleado: {
          include: {
            usuario: { select: { nombre: true } },
          },
        },
        servicios: {
          include: {
            servicio: {
              select: { id: true, nombre: true, duracionMinutos: true },
            },
          },
        },
      },
    });

    return citas_db.map((cita) => {
      const lista_nombres = cita.servicios
        .map((item) => item.servicio.nombre)
        .join(", ");

      const nombre_empleado = cita.empleado?.usuario?.nombre ?? "No asignado";

      return {
        id: cita.id,
        fechaHora: cita.fechaHora,
        estado: cita.estado,
        cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
        empleado: nombre_empleado,
        servicio: lista_nombres || "Sin servicios asignados",
        total: Number(cita.total),
        anticipo: Number(cita.anticipo),
        restante: Number(cita.total) - Number(cita.anticipo),
        cliente_id: cita.usuarioId,
        empleado_id: cita.empleadoId,
        servicios_items: cita.servicios.map((s) => ({
          id: s.servicio.id,
          nombre: s.servicio.nombre,
          precio: Number(s.precio),
        })),
      };
    });
  }

  /**
   * Crea una nueva cita con asignación de empleado opcional.
   *
   * Lógica Transaccional:
   * 1. Valida que todos los servicios solicitados existan y estén activos.
   * 2. Si se recibe un empleado, confirma su pertenencia a la sucursal activa.
   * 3. Calcula el total acumulando precios base y persiste la cita.
   * 4. Valida integridad financiera (Anticipo <= Total).
   */
  async agendar(
    data: {
      usuario_id: string;
      servicios_ids: string[];
      fecha_hora: string;
      empleado_id?: string;
      anticipo?: number;
    },
    sucursal_id: string
  ) {
    const servicios_encontrados = await this.prisma.servicio.findMany({
      where: { id: { in: data.servicios_ids }, activo: true },
    });

    if (servicios_encontrados.length !== data.servicios_ids.length) {
      throw new BadRequestException(
        "Uno o más servicios solicitados no existen o están inactivos."
      );
    }

    if (data.empleado_id) {
      const empleado_valido = await this.prisma.empleadoSucursal.findUnique({
        where: {
          empleadoId_sucursalId: {
            empleadoId: data.empleado_id,
            sucursalId: sucursal_id,
          },
        },
      });

      if (!empleado_valido) {
        throw new BadRequestException(
          "El empleado seleccionado no pertenece a esta sucursal."
        );
      }
    }

    const total_calculado = servicios_encontrados.reduce(
      (suma, servicio) => suma + Number(servicio.precioBase),
      0
    );

    const anticipo = data.anticipo ?? 0;
    if (anticipo > total_calculado) {
      throw new BadRequestException(
        `El anticipo ($${anticipo}) no puede ser mayor al total de los servicios ($${total_calculado}).`
      );
    }

    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        empleadoId: data.empleado_id,
        fechaHora: new Date(data.fecha_hora),
        estado: CitaEstado.pendiente,
        total: total_calculado,
        anticipo: anticipo,
        servicios: {
          create: servicios_encontrados.map((servicio) => ({
            servicioId: servicio.id,
            precio: servicio.precioBase,
          })),
        },
      },
    });
  }

  /**
   * Actualiza los servicios y empleado vinculado a una cita pendiente.
   */
  async actualizar_items(
    cita_id: string,
    nuevos_servicios_ids: string[],
    sucursal_id: string,
    nuevo_empleado_id?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cita_actual = await tx.cita.findUnique({
        where: { id: cita_id },
      });

      if (!cita_actual) throw new NotFoundException("Cita no encontrada");

      if (cita_actual.sucursalId !== sucursal_id) {
        throw new BadRequestException(
          "La cita no pertenece a la sucursal activa"
        );
      }

      if (cita_actual.estado !== CitaEstado.pendiente) {
        throw new ConflictException(
          "Solo se pueden editar citas en estado 'pendiente'. Esta cita ya fue procesada."
        );
      }

      const servicios_nuevos = await tx.servicio.findMany({
        where: { id: { in: nuevos_servicios_ids }, activo: true },
      });

      if (servicios_nuevos.length !== nuevos_servicios_ids.length) {
        throw new BadRequestException(
          "Uno o más servicios nuevos no son válidos"
        );
      }

      await tx.citaServicio.deleteMany({
        where: { citaId: cita_id },
      });

      const nuevo_total = servicios_nuevos.reduce(
        (acc, srv) => acc + Number(srv.precioBase),
        0
      );

      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: {
          total: nuevo_total,
          empleadoId: nuevo_empleado_id,
          servicios: {
            create: servicios_nuevos.map((srv) => ({
              servicioId: srv.id,
              precio: srv.precioBase,
            })),
          },
        },
        include: { servicios: true },
      });

      return {
        mensaje: "Cita actualizada correctamente",
        total_actualizado: Number(cita_actualizada.total),
        items_count: cita_actualizada.servicios.length,
      };
    });
  }

  /**
   * Cancela una cita y registra el movimiento en auditoría.
   */
  async cancelar(cita_id: string, motivo: string, sucursal_id: string) {
    return this.prisma.$transaction(async (tx) => {
      const cita = await tx.cita.findUnique({ where: { id: cita_id } });

      if (!cita) throw new NotFoundException("Cita no encontrada");

      if (cita.sucursalId !== sucursal_id) {
        throw new BadRequestException("La cita no pertenece a esta sucursal");
      }

      if (cita.estado !== CitaEstado.pendiente) {
        throw new ConflictException(
          "Solo se pueden cancelar citas pendientes."
        );
      }

      const cita_cancelada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cancelada },
      });

      await tx.auditLog.create({
        data: {
          entidad: "Cita",
          accion: "Cancelación",
          sucursalId: sucursal_id,
          usuarioId: cita.usuarioId,
          descripcion: `Motivo: ${motivo}`,
        },
      });

      return { ...cita_cancelada, mensaje: "Cita cancelada correctamente." };
    });
  }

  /**
   * Cierra una cita transformando la reserva en venta.
   *
   * Lógica Transaccional (Actualizada S3.4):
   * 1. Reasignación opcional de empleado (previo al cierre).
   * 2. Aplicación de Promociones: Valida la promo enviada y descuenta el monto total.
   * 3. Descuento de inventario.
   * 4. Generación de puntos (sobre monto pagado real).
   * 5. Cálculo de comisiones (sobre monto pagado real).
   * 6. Actualización de estado y auditoría.
   *
   * @param cita_id - UUID de la cita.
   * @param sucursal_id - Contexto de seguridad.
   * @param empleado_id - (Opcional) Reasignación de última hora.
   * @param promo_id - (Opcional) ID de la promoción a aplicar.
   */
  async cerrar(
    cita_id: string,
    sucursal_id: string,
    empleado_id?: string,
    promo_id?: string // <--- Nuevo parámetro SPRINT 3.4
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. REASIGNACIÓN DE EMPLEADO
      if (empleado_id) {
        const es_valido = await tx.empleadoSucursal.findUnique({
          where: {
            empleadoId_sucursalId: {
              empleadoId: empleado_id,
              sucursalId: sucursal_id,
            },
          },
        });

        if (!es_valido) {
          throw new BadRequestException(
            "El empleado seleccionado no pertenece a esta sucursal."
          );
        }

        await tx.cita.update({
          where: { id: cita_id },
          data: { empleadoId: empleado_id },
        });
      }

      // 2. OBTENCIÓN DE DATOS COMPLETOS
      const cita_completa = await tx.cita.findUnique({
        where: { id: cita_id },
        include: {
          servicios: {
            include: {
              servicio: { include: { serviciosMateriales: true } },
            },
          },
          empleado: true,
          usuario: true,
        },
      });

      if (!cita_completa) throw new NotFoundException("La cita no existe.");

      if (cita_completa.sucursalId !== sucursal_id) {
        throw new BadRequestException(
          "Error de seguridad: Sucursal incorrecta."
        );
      }

      if (cita_completa.estado === CitaEstado.cerrada) {
        throw new ConflictException("La cita ya fue cerrada previamente.");
      }

      // --- CÁLCULO DE MONTOS (PROMOCIONES) ---
      let monto_final = Number(cita_completa.total);
      let descuento_aplicado = 0;

      // Si se envía una promoción, intentamos aplicarla
      if (promo_id) {
        // Obtenemos los IDs de los servicios para validar targeting
        const servicios_ids = cita_completa.servicios.map((s) => s.servicioId);

        // Llamamos al motor de validación (Inyectado)
        const resultado_promo =
          await this.promotions_service.validar_y_calcular(
            promo_id,
            sucursal_id,
            servicios_ids,
            monto_final
          );

        if (!resultado_promo.valido) {
          // Si la promo no es válida, ABORTAMOS la transacción.
          // Política: No permitir cierres con promociones inválidas.
          throw new ConflictException(
            `Error de promoción: ${resultado_promo.mensaje}`
          );
        }

        // Aplicamos el descuento
        descuento_aplicado = resultado_promo.promo?.monto_descuento ?? 0;
        monto_final -= descuento_aplicado;

        // Evitamos montos negativos
        if (monto_final < 0) monto_final = 0;

        // Persistimos la aplicación de la promo para reportes
        await tx.promocionAplicada.create({
          data: {
            citaId: cita_completa.id,
            promocionId: promo_id,
            montoDescontado: descuento_aplicado,
            porcentajeAplicado: resultado_promo.promo?.porcentaje,
          },
        });
      }
      // ----------------------------------------

      // 3. DESCUENTO DE INVENTARIO
      for (const item_venta of cita_completa.servicios) {
        const receta = item_venta.servicio.serviciosMateriales;
        for (const insumo of receta) {
          const existencia_actual = await tx.existencia.findUnique({
            where: {
              sucursalId_materialId: {
                sucursalId: sucursal_id,
                materialId: insumo.materialId,
              },
            },
          });

          if (!existencia_actual) {
            throw new ConflictException(
              `Material '${insumo.materialId}' no configurado en sucursal.`
            );
          }

          if (Number(existencia_actual.stockActual) < Number(insumo.cantidad)) {
            throw new ConflictException(
              `Stock insuficiente: ${insumo.materialId}`
            );
          }

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

      // 4. GENERACIÓN DE PUNTOS (5% sobre monto pagado real)
      const puntos_a_otorgar = Math.floor(monto_final * 0.05);
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

      // 5. CÁLCULO DE COMISIONES (Sobre monto pagado real)
      if (cita_completa.empleado) {
        const pct = Number(cita_completa.empleado.porcentajeComision);
        const monto_comision = monto_final * (pct / 100);

        if (monto_comision > 0) {
          await tx.comision.create({
            data: {
              empleadoId: cita_completa.empleado.id,
              citaId: cita_completa.id,
              porcentaje: pct,
              monto: monto_comision,
            },
          });
        }
      }

      // 6. ACTUALIZACIÓN DE ESTADO FINAL
      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cerrada },
      });

      // 7. AUDITORÍA
      await tx.auditLog.create({
        data: {
          entidad: "Cita",
          accion: "Cierre",
          sucursalId: sucursal_id,
          usuarioId: cita_completa.usuarioId,
          descripcion: `Cierre venta. Total: $${monto_final}. Desc: $${descuento_aplicado}. Empleado: ${cita_completa.empleado?.id ?? "Ninguno"}`,
        },
      });

      return {
        ...cita_actualizada,
        mensaje: "Venta procesada correctamente.",
        descuento_aplicado,
        total_pagado: monto_final,
      };
    });
  }
}
