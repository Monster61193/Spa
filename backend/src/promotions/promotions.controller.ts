import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { PromotionsService } from "./promotions.service";
import { z } from "zod";

// Esquema de validación para el cálculo
const PreviewPromoSchema = z.object({
  promo_id: z.string().uuid(),
  servicios_ids: z.array(z.string()).min(1),
  total_actual: z.coerce.number().positive(),
});

@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotions_service: PromotionsService) {}

  @Get("active")
  async activar(@Query("sucursalId") sucursalId?: string) {
    return { items: await this.promotions_service.listar(sucursalId) };
  }

  /**
   * POST /promotions/preview
   * Verifica si una promoción es válida para un conjunto de servicios y retorna el descuento calculado.
   * No guarda nada en base de datos, es solo consulta (dry-run).
   */
  @Post("preview")
  async previsualizar(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";

    // Validación de entrada
    const datos = PreviewPromoSchema.parse(payload);

    const resultado = await this.promotions_service.validar_y_calcular(
      datos.promo_id,
      branch_id,
      datos.servicios_ids,
      datos.total_actual
    );

    if (!resultado.valido) {
      // Retornamos 400 controlado para que el frontend muestre el mensaje específico
      throw new BadRequestException(resultado.mensaje);
    }

    return resultado;
  }
}
