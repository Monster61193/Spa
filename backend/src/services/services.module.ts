import { Module } from "@nestjs/common";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Módulo de servicios y overrides aplicados por sucursal.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
