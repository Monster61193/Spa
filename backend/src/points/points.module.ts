import { Module } from "@nestjs/common";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
import { PrismaModule } from "../prisma/prisma.module"; // <--- Importante

/**
 * Módulo que gestiona puntos de lealtad por sucursal.
 */
@Module({
  imports: [PrismaModule], // <--- Asegura que PrismaService esté disponible
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}
