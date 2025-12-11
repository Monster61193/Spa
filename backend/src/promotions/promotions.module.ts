import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Módulo de Promociones.
 * Gestiona las campañas de descuento globales y locales.
 */
@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  // --- CORRECCIÓN CRÍTICA ---
  // Exportamos el servicio para que AppointmentsModule pueda usarlo
  exports: [PromotionsService],
})
export class PromotionsModule {}
