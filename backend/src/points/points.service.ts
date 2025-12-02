import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MovimientoTipo } from "@prisma/client";

/**
 * Servicio encargado de la gestión y consulta de puntos de lealtad.
 * Calcula saldos en tiempo real basándose en el historial de movimientos.
 */
@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el historial de movimientos de puntos para una sucursal.
   * Útil para auditoría y vistas de detalle en el frontend.
   *
   * @param sucursal_id - ID de la sucursal activa.
   */
  async history(sucursal_id: string) {
    // Consulta a la tabla real 'puntos_movimientos'
    const historial = await this.prisma.puntosMovimiento.findMany({
      where: { sucursalId: sucursal_id },
      include: {
        usuario: { select: { nombre: true, email: true } },
        cita: { select: { fechaHora: true } },
      },
      orderBy: { fecha: "desc" },
    });

    // Mapeo a DTO plano para el frontend
    return historial.map((mov) => ({
      id: mov.id,
      cliente: mov.usuario.nombre,
      tipo: mov.tipo, // 'earn' (ganado) | 'redeem' (usado)
      cantidad: mov.cantidad,
      fecha: mov.fecha,
      cita_fecha: mov.cita ? mov.cita.fechaHora : null,
    }));
  }

  /**
   * Calcula el saldo actual de puntos por cliente en una sucursal.
   * Realiza una agregación en memoria: (Total Ganado - Total Usado).
   *
   * @param sucursal_id - ID de la sucursal activa.
   */
  async balance(sucursal_id: string) {
    // 1. Obtenemos todos los movimientos de la sucursal
    const movimientos = await this.prisma.puntosMovimiento.findMany({
      where: { sucursalId: sucursal_id },
      include: {
        usuario: { select: { id: true, nombre: true } },
      },
    });

    // 2. Agrupamos y calculamos saldo por usuario
    // Usamos un Map para acumular los totales por cliente
    const saldos_map = new Map<string, { cliente: string; puntos: number }>();

    for (const mov of movimientos) {
      const usuario_id = mov.usuarioId;
      const nombre_cliente = mov.usuario.nombre;

      // Inicializamos si es el primer movimiento del usuario
      if (!saldos_map.has(usuario_id)) {
        saldos_map.set(usuario_id, { cliente: nombre_cliente, puntos: 0 });
      }

      const entrada_actual = saldos_map.get(usuario_id)!;

      // Lógica de negocio: Earn suma, Redeem resta
      if (mov.tipo === MovimientoTipo.earn) {
        entrada_actual.puntos += mov.cantidad;
      } else {
        entrada_actual.puntos -= mov.cantidad;
      }
    }

    // 3. Filtramos solo los clientes con saldo positivo para mostrar en el reporte
    const lista_saldos = Array.from(saldos_map.values()).filter(
      (item) => item.puntos > 0
    );

    return { saldo: lista_saldos, sucursalId: sucursal_id };
  }
}
