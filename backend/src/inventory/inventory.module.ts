import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { PrismaModule } from "../prisma/prisma.module";
/**
 * Módulo para inventario multi-sucursal.
 */
@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
