import { Module } from "@nestjs/common";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
import { PrismaModule } from "../prisma/prisma.module"; // <--- Importar el módulo de BD

/**
 * Módulo que gestiona puntos de lealtad por sucursal.
 */
@Module({
  imports: [PrismaModule], // <--- Registrar aquí para poder usar PrismaService
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}
