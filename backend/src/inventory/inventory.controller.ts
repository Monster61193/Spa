import { Controller, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Retorna snapshot de materiales por sucursal.
   * CORRECCIÓN: Agregamos async/await para resolver la promesa del servicio.
   */
  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? "branch-principal";

    // Await: Esperamos a que la DB responda antes de enviar el JSON
    const datos = await this.inventoryService.listar(branchId);

    return { snapshot: datos };
  }
}
