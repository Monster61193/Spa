import { Module } from "@nestjs/common";
import { PromotionsController } from "./promotions.controller";
import { PromotionsService } from "./promotions.service";
// Importación requerida para inyectar PrismaService
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Módulo de Promociones.
 * Gestiona las campañas de descuento globales y locales.
 */
@Module({
  imports: [PrismaModule], // <--- Registro explícito de dependencias
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
