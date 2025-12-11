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
 * Centraliza la lógica transaccional para el ciclo de vida de la cita.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

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
        // Incluimos al empleado y su perfil de usuario para obtener el nombre
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

      // Lógica de presentación para empleado
      const nombre_empleado = cita.empleado?.usuario?.nombre ?? "No asignado";

      // Mapeamos a una estructura plana pero rica en datos
      return {
        id: cita.id,
        fechaHora: cita.fechaHora,
        estado: cita.estado,

        // Datos de presentación
        cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
        empleado: nombre_empleado,
        servicio: lista_nombres || "Sin servicios asignados",
        total: Number(cita.total),
        anticipo: Number(cita.anticipo),
        restante: Number(cita.total) - Number(cita.anticipo),
        // Metadatos para Edición (Hidden fields en tabla, usados en Modal)
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
   * 1. Valida que todos los servicios solicitados existan y estén activos para evitar referencias inválidas.
   * 2. Si se recibe un empleado, confirma su pertenencia a la sucursal activa como control de seguridad.
   * 3. Calcula el total acumulando precios base y persiste la cita junto con los servicios seleccionados y el empleado opcional.
   *
   * @param data - Payload con el usuario, servicios, fecha y empleado (si aplica) para la cita.
   * @param sucursal_id - ID de la sucursal actual que sirve como contexto de tenancy y control de acceso.
   * @returns La cita recién creada con sus relaciones básicas.
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
    // 1. Validar servicios (Lógica existente)
    const servicios_encontrados = await this.prisma.servicio.findMany({
      where: { id: { in: data.servicios_ids }, activo: true },
    });

    if (servicios_encontrados.length !== data.servicios_ids.length) {
      throw new BadRequestException(
        "Uno o más servicios solicitados no existen o están inactivos."
      );
    }

    // 2. Validar Empleado (Nueva lógica de seguridad)
    // Si se envía empleado_id, verificar que pertenezca a la sucursal para evitar
    // asignar citas a empleados de otra sede.
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

    // 2. NUEVA VALIDACIÓN DE NEGOCIO: Integridad Financiera
    const anticipo = data.anticipo ?? 0;
    if (anticipo > total_calculado) {
      throw new BadRequestException(
        `El anticipo ($${anticipo}) no puede ser mayor al total de los servicios ($${total_calculado}).`
      );
    }

    // 3. Crear Cita
    return this.prisma.cita.create({
      data: {
        sucursalId: sucursal_id,
        usuarioId: data.usuario_id,
        // Vinculamos el empleado si existe
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
   *
   * Lógica Transaccional:
   * 1. Verifica que la cita exista, pertenezca a la sucursal y se encuentre en estado pendiente para permitir la edición.
   * 2. Valida que cada servicio solicitado esté activo en el catálogo antes de resetear las relaciones de la cita.
   * 3. Elimina los ítems anteriores, recalcula el total según el precio base actual y crea las nuevas relaciones de servicios.
   * 4. Actualiza la cabecera de la cita, opcionalmente reasignando empleado, y devuelve los totales resultantes.
   *
   * @param cita_id - UUID de la cita que se desea actualizar.
   * @param nuevos_servicios_ids - Lista de IDs de servicios activos que reemplazan a los anteriores.
   * @param sucursal_id - ID de la sucursal que controla el contexto del guard y garantiza tenancy seguro.
   * @param nuevo_empleado_id - ID del empleado que se asignará si se requiere cambiar responsable al editar.
   * @returns Objeto con mensaje de éxito, total recalculado y conteo de servicios actuales.
   */
  async actualizar_items(
    cita_id: string,
    nuevos_servicios_ids: string[],
    sucursal_id: string,
    nuevo_empleado_id?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validación Inicial
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

      // 2. Validación de Catálogo (Nuevos Servicios)
      const servicios_nuevos = await tx.servicio.findMany({
        where: { id: { in: nuevos_servicios_ids }, activo: true },
      });

      if (servicios_nuevos.length !== nuevos_servicios_ids.length) {
        throw new BadRequestException(
          "Uno o más servicios nuevos no son válidos"
        );
      }

      // 3. Borrado de Relaciones Anteriores (Reset)
      await tx.citaServicio.deleteMany({
        where: { citaId: cita_id },
      });

      // 4. Cálculo de Nuevo Total
      const nuevo_total = servicios_nuevos.reduce(
        (acc, srv) => acc + Number(srv.precioBase),
        0
      );

      // 5. Inserción de Nuevas Relaciones y Actualización de Cabecera
      const cita_actualizada = await tx.cita.update({
        where: { id: cita_id },
        data: {
          total: nuevo_total,
          empleadoId: nuevo_empleado_id, // <--- Actualización del empleado
          servicios: {
            create: servicios_nuevos.map((srv) => ({
              servicioId: srv.id,
              precio: srv.precioBase, // Snapshot del precio actual
            })),
          },
        },
        include: { servicios: true }, // Retornamos para confirmar
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
   *
   * Lógica Transaccional:
   * 1. Valida existencia, sucursal y estado pendiente de la cita para impedir cancelaciones indebidas.
   * 2. Cambia el estado de la cita y persiste el nuevo valor en la cabecera.
   * 3. Inserta un registro de auditoría con el motivo entregado para mantener trazabilidad.
   *
   * @param cita_id - UUID de la cita que se desea cancelar.
   * @param motivo - Descripción textual que se almacenará en auditoría para la acción.
   * @param sucursal_id - ID de la sucursal activa que sirve como control de tenancy y guard.
   * @returns Cita actualizada con estado cancelada y mensaje de confirmación.
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

      // Actualizamos estado
      const cita_cancelada = await tx.cita.update({
        where: { id: cita_id },
        data: { estado: CitaEstado.cancelada },
      });

      // Registramos en auditoría (Vital para saber por qué se canceló)
      await tx.auditLog.create({
        data: {
          entidad: "Cita",
          accion: "Cancelación",
          sucursalId: sucursal_id,
          usuarioId: cita.usuarioId, // Si existe
          descripcion: `Motivo: ${motivo}`,
        },
      });

      return { ...cita_cancelada, mensaje: "Cita cancelada correctamente." };
    });
  }

  /**
   * Cierra una cita transformando la reserva pendiente en venta y moviendo inventario/comisiones.
   *
   * Lógica Transaccional:
   * 1. Reasigna el empleado si se proporciona un nuevo ID validando su pertenencia a la sucursal antes de continuar.
   * 2. Recupera la cita completa con servicios, materiales, empleado y usuario para calcular impactos y validar sucursal/estado.
   * 3. Descuenta el inventario de cada material usado por servicio, revirtiendo en caso de conflicto con stock insuficiente o configuración faltante.
   * 4. Genera un movimiento de puntos (5% del total) cuando hay usuario y el monto supera cero.
   * 5. Calcula y registra la comisión del empleado según su porcentaje asociado a la cita.
   * 6. Marca la cita como cerrada y persiste el nuevo estado.
   * 7. Inserta una entrada de auditoría indicando el cierre de venta y el monto final.
   *
   * @param cita_id - UUID de la cita que se va a cerrar como venta.
   * @param sucursal_id - ID de la sucursal activa para validar Tenancy y localizar inventarios.
   * @param empleado_id - ID opcional del empleado responsable que se asigna al momento del cierre.
   * @returns Cita actualizada con estado cerrado y mensaje indicando éxito del proceso de venta.
   */
  async cerrar(cita_id: string, sucursal_id: string, empleado_id?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. REASIGNACIÓN PREVIA (Si se envió un empleado al cerrar)
      // Esto es crítico: debe ocurrir ANTES de leer la 'cita_completa' para que
      // el cálculo de comisión use al empleado correcto.
      if (empleado_id) {
        // Validamos seguridad: el empleado debe ser de la sucursal
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

        // Actualizamos la cita
        await tx.cita.update({
          where: { id: cita_id },
          data: { empleadoId: empleado_id },
        });
      }

      // 2. OBTENCIÓN DE DATOS COMPLETOS
      // Ahora sí leemos la cita. Si se actualizó arriba, 'empleado' vendrá correcto.
      const cita_completa = await tx.cita.findUnique({
        where: { id: cita_id },
        include: {
          servicios: {
            include: {
              servicio: { include: { serviciosMateriales: true } },
            },
          },
          empleado: true, // Trae porcentajeComision
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

      const monto_total = Number(cita_completa.total);

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

      // 4. GENERACIÓN DE PUNTOS (5%)
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

      // 5. CÁLCULO DE COMISIONES
      // Usamos el empleado que acabamos de asegurar en el paso 1.
      if (cita_completa.empleado) {
        const pct = Number(cita_completa.empleado.porcentajeComision);
        const monto_comision = monto_total * (pct / 100);

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
          descripcion: `Cierre venta. Total: $${monto_total}. Empleado: ${cita_completa.empleado?.id ?? "Ninguno"}`,
        },
      });

      return { ...cita_actualizada, mensaje: "Venta procesada correctamente." };
    });
  }
}
