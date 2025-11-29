import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../common/constants/roles";

/**
 * Servicio para la gestión de usuarios y clientes.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos los usuarios registrados que pueden ser clientes.
   * (Por ahora listamos todos, luego podrías filtrar por rol).
   */
  async listar_clientes() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });
    return usuarios;
  }
}
