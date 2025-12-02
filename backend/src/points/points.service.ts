import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MovimientoTipo } from "@prisma/client";

/**
 * Servicio de Negocio: Gestión de Puntos de Lealtad.
 * -----------------------------------------------------------------------------
 * Responsable de calcular saldos y auditar el historial de puntos de los clientes.
 * Interactúa directamente con la tabla 'puntos_movimientos'.
 */
@Injectable()
export class PointsService {
  /**
   * Inyección de dependencias.
   * @param prisma - Cliente ORM para acceso a datos.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el historial detallado de movimientos (Kardex) para una sucursal.
   * Útil para vistas de auditoría o perfil del cliente.
   * * @param sucursal_id - UUID de la sucursal activa (filtro de seguridad).
   * @returns Lista de movimientos ordenados cronológicamente (más reciente primero).
   */
  async history(sucursal_id: string) {
    // BLOQUE 1: Consulta a Base de Datos
    // Traemos los movimientos crudos filtrando por la sucursal solicitada.
    // Incluimos relaciones (JOINs) para mostrar nombres en lugar de IDs.
    const historial_db = await this.prisma.puntosMovimiento.findMany({
      where: { sucursalId: sucursal_id },
      include: {
        usuario: {
          select: { nombre: true, email: true }, // Solo datos necesarios del usuario
        },
        cita: {
          select: { fechaHora: true }, // Fecha de la cita que generó el movimiento
        },
      },
      orderBy: { fecha: "desc" }, // Orden descendente (LIFO)
    });

    // BLOQUE 2: Transformación de Datos (DTO)
    // Convertimos la estructura de BD a una estructura plana y limpia para el Frontend.
    const historial_dto = historial_db.map((mov) => ({
      id: mov.id,
      cliente: mov.usuario.nombre,
      email: mov.usuario.email,
      tipo: mov.tipo, // Enum: 'earn' (ganar) | 'redeem' (gastar)
      cantidad: mov.cantidad,
      fecha: mov.fecha,
      // Si el movimiento no tiene cita (ej. regalo manual), manejamos el nulo
      cita_fecha: mov.cita ? mov.cita.fechaHora : null,
    }));

    return historial_dto;
  }

  /**
   * Calcula el saldo actual de puntos por cliente.
   * Realiza una agregación en memoria: (Total Ganado - Total Gastado).
   * * @param sucursal_id - ID de la sucursal para filtrar el contexto.
   * @returns Objeto con la lista de saldos positivos por cliente.
   */
  async balance(sucursal_id: string) {
    // BLOQUE 1: Obtención de Datos Crudos
    // Traemos TODOS los movimientos de la sucursal.
    // Nota: En sistemas masivos, esto se reemplazaría por un `GROUP BY` en SQL.
    const movimientos = await this.prisma.puntosMovimiento.findMany({
      where: { sucursalId: sucursal_id },
      include: {
        usuario: { select: { id: true, nombre: true } },
      },
    });

    // BLOQUE 2: Lógica de Agregación (Cálculo de Saldo)
    // Usamos un Map para acumular los puntos por ID de usuario único.
    const saldos_map = new Map<string, { cliente: string; puntos: number }>();

    for (const mov of movimientos) {
      const usuario_id = mov.usuarioId;
      const nombre_cliente = mov.usuario.nombre;

      // Si es la primera vez que procesamos a este usuario, inicializamos su registro
      if (!saldos_map.has(usuario_id)) {
        saldos_map.set(usuario_id, { cliente: nombre_cliente, puntos: 0 });
      }

      // Obtenemos la referencia al acumulador del usuario
      const entrada_actual = saldos_map.get(usuario_id)!;

      // Aplicamos la aritmética según el tipo de movimiento
      if (mov.tipo === MovimientoTipo.earn) {
        entrada_actual.puntos += mov.cantidad; // Sumar puntos ganados
      } else {
        entrada_actual.puntos -= mov.cantidad; // Restar puntos usados
      }
    }

    // BLOQUE 3: Filtrado y Respuesta
    // Convertimos el Map a Array y filtramos usuarios con saldo 0 o negativo
    // para no ensuciar el reporte.
    const lista_saldos = Array.from(saldos_map.values()).filter(
      (item) => item.puntos > 0
    );

    return {
      sucursalId: sucursal_id,
      saldo: lista_saldos,
    };
  }
}
