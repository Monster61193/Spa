import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
import { PrismaModule } from "../prisma/prisma.module"; // <--- Importar BD

/**
 * Módulo de promociones y campañas.
 */
@Module({
  imports: [PrismaModule], // <--- Registrar BD
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
