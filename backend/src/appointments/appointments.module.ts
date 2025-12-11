import { Module } from "@nestjs/common";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PromotionsModule } from "../promotions/promotions.module";
/**
 * Módulo de citas y flujos de cierre que integran inventario y puntos.
 */
@Module({
  imports: [PrismaModule, PromotionsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
