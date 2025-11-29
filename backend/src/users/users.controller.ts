import { Controller, Get } from "@nestjs/common";
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
}
