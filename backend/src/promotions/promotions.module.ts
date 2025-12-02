import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { PrismaModule } from "../prisma/prisma.module"; // <--- Importante

/**
 * Módulo de promociones y campañas.
 */
@Module({
  imports: [PrismaModule], // <--- Asegura que PrismaService esté disponible
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
