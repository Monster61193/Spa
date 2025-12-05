import { Controller, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "./users.service";

/**
 * Endpoints para gestión de usuarios.
 */
@Controller("users")
export class UsersController {
  constructor(private readonly users_service: UsersService) {}

  /**
   * Retorna la lista de clientes disponibles para agendar.
   * GET /api/users/clients
   */
  @Get("clients")
  async listar_clientes() {
    const items = await this.users_service.listar_clientes();
    return { items };
  }

  /**
   * Retorna la lista de empleados activos para la sucursal actual.
   * GET /api/users/employees
   */
  @Get("employees")
  async listar_empleados(@Req() request: Request & { branchId?: string }) {
    // El BranchGuard o el interceptor garantizan que branchId exista,
    // pero usamos un fallback seguro por robustez.
    const branch_id = request.branchId ?? "branch-principal";

    const items = await this.users_service.listar_empleados(branch_id);
    return { items };
  }
}
