import { Module } from "@nestjs/common";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";
// Importación requerida para inyectar PrismaService
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Módulo de Puntos.
 * Agrupa la lógica de fidelización y expone los endpoints correspondientes.
 */
@Module({
  imports: [PrismaModule], // <--- Registro explícito de dependencias
  controllers: [PointsController],
  providers: [PointsService],
})
export class PointsModule {}
