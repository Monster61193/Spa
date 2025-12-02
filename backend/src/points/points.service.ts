import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MovimientoTipo } from "@prisma/client";

/**
 * Servicio encargado de la gestión y consulta de puntos de lealtad.
 * Calcula saldos en tiempo real basándose en el historial de movimientos (Event Sourcing simplificado).
 */
@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el historial de movimientos de puntos para una sucursal.
   * Útil para auditoría y vistas de detalle.
   *
   * @param sucursal_id - ID de la sucursal activa.
   */
  async history(sucursal_id: string) {
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
      tipo: mov.tipo, // 'earn' | 'redeem'
      cantidad: mov.cantidad,
      fecha: mov.fecha,
      cita_fecha: mov.cita ? mov.cita.fechaHora : null,
    }));
  }

  /**
   * Calcula el saldo actual de puntos por cliente en una sucursal.
   * Realiza una agregación en memoria (o DB) de: Ganados - Usados.
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

    // 2. Agrupamos y calculamos saldo por usuario en memoria
    // Nota: Para escalas masivas, esto se movería a una Raw Query de SQL (SUM CASE...)
    const saldos_map = new Map<string, { cliente: string; puntos: number }>();

    for (const mov of movimientos) {
      const usuario_id = mov.usuarioId;
      const nombre_cliente = mov.usuario.nombre;

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

    // 3. Retornamos solo los clientes que tienen saldo positivo
    const lista_saldos = Array.from(saldos_map.values()).filter(
      (item) => item.puntos > 0
    );

    return { saldo: lista_saldos, sucursalId: sucursal_id };
  }
}
