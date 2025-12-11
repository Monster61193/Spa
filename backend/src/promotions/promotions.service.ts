import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista las promociones activas y visibles para una sucursal.
   */
  async listar(sucursal_id?: string) {
    const fecha_actual = new Date();

    const promociones_db = await this.prisma.promocion.findMany({
      where: {
        estado: true,
        fechaInicio: { lte: fecha_actual },
        fechaFin: { gte: fecha_actual },
        OR: [{ sucursalId: null }, { sucursalId: sucursal_id }],
      },
      orderBy: { descuento: "desc" },
    });

    return promociones_db.map((promo) => ({
      id: promo.id,
      nombre: promo.nombre,
      descuento: Number(promo.descuento),
      tipo_alcance: promo.sucursalId ? "Local" : "Global",
    }));
  }

  /**
   * Valida y calcula el descuento aplicable para un carrito de servicios.
   *
   * Reglas de Negocio:
   * 1. La promoción debe existir y estar activa.
   * 2. Debe estar vigente (fechas).
   * 3. Debe pertenecer a la sucursal o ser global.
   * 4. Si la promoción está ligada a servicios específicos, al menos uno debe estar en el carrito.
   *
   * @param promo_id - ID de la promoción a aplicar.
   * @param sucursal_id - Sucursal donde se intenta aplicar.
   * @param servicios_ids - Lista de servicios que el cliente va a comprar.
   * @param total_actual - Monto total actual de la cita (para calcular montos fijos si fuera necesario).
   */
  async validar_y_calcular(
    promo_id: string,
    sucursal_id: string,
    servicios_ids: string[],
    total_actual: number
  ) {
    const fecha_actual = new Date();

    // 1. Obtener la promoción con sus restricciones de servicios
    const promo = await this.prisma.promocion.findUnique({
      where: { id: promo_id },
      include: { promocionServicios: true },
    });

    if (!promo) throw new NotFoundException("Promoción no encontrada");

    // 2. Validaciones Base (Estado, Fechas, Sucursal)
    if (!promo.estado) {
      return { valido: false, mensaje: "La promoción está inactiva" };
    }

    if (fecha_actual < promo.fechaInicio || fecha_actual > promo.fechaFin) {
      return { valido: false, mensaje: "La promoción ha caducado o aún no inicia" };
    }

    if (promo.sucursalId && promo.sucursalId !== sucursal_id) {
      return { valido: false, mensaje: "Esta promoción no aplica en esta sucursal" };
    }

    // 3. Validación de Servicios (Targeting)
    // Si la tabla intermedia tiene registros, la promo es exclusiva para esos servicios.
    if (promo.promocionServicios.length > 0) {
      const servicios_validos = promo.promocionServicios.map((ps) => ps.servicioId);
      // Verificamos si AL MENOS UNO de los servicios del carrito está en la lista de la promo
      const aplica = servicios_ids.some((id) => servicios_validos.includes(id));

      if (!aplica) {
        return {
          valido: false,
          mensaje: "La promoción no aplica a ninguno de los servicios seleccionados",
        };
      }
    }

    // 4. Cálculo del Descuento
    // Asumimos que 'descuento' es PORCENTAJE (según semilla).
    // // TODO: En el futuro, agregar campo 'tipo_descuento' (monto vs porcentaje) en BD.
    const porcentaje = Number(promo.descuento);
    const monto_descuento = total_actual * (porcentaje / 100);

    return {
      valido: true,
      mensaje: "Promoción aplicada correctamente",
      promo: {
        id: promo.id,
        nombre: promo.nombre,
        porcentaje: porcentaje,
        monto_descuento: Number(monto_descuento.toFixed(2)),
      },
    };
  }
}