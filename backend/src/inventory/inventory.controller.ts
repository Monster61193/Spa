import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { InventoryService } from "./inventory.service";
import { z } from "zod";

/**
 * Esquema para crear un nuevo material.
 */
const CreateMaterialSchema = z.object({
  nombre: z.string().min(3, "Nombre muy corto"),
  unidad: z.string().min(1, "La unidad es requerida (ej. ml, pz)"),
  stock_inicial: z.coerce.number().min(0).default(0),
  stock_minimo: z.coerce.number().min(0).default(5),
  costo_unitario: z.coerce.number().min(0).optional(),
});

/**
 * Esquema para reabastecer (entrada de mercancía).
 */
const RestockSchema = z.object({
  cantidad: z.coerce
    .number()
    .positive("La cantidad a agregar debe ser positiva"),
  costo_compra: z.coerce.number().min(0).optional(), // Para reportes futuros
});

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ... (GET listar existente) ...
  @Get()
  async listar(@Req() request: Request & { branchId?: string }) {
    const branchId = request.branchId ?? "branch-principal";
    const datos = await this.inventoryService.listar(branchId);
    return { snapshot: datos };
  }

  /**
   * POST /inventory
   * Crea un nuevo material y su existencia inicial en la sucursal.
   */
  @Post()
  async crear(
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos = CreateMaterialSchema.parse(payload);

    const resultado = await this.inventoryService.crear_material(
      datos,
      branch_id
    );
    return { item: resultado, mensaje: "Material registrado correctamente" };
  }

  /**
   * POST /inventory/:id/restock
   * Registra una entrada de inventario (compra de insumos).
   */
  @Post(":id/restock")
  async reabastecer(
    @Param("id") material_id: string,
    @Body() payload: unknown,
    @Req() request: Request & { branchId?: string }
  ) {
    const branch_id = request.branchId ?? "branch-principal";
    const datos = RestockSchema.parse(payload);

    const nuevo_stock = await this.inventoryService.reabastecer(
      material_id,
      datos.cantidad,
      branch_id
    );

    return {
      mensaje: "Stock actualizado",
      stock_actual: nuevo_stock,
    };
  }
}
