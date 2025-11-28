import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";

/**
 * Servicio encargado de la lógica de autenticación y generación de sesiones.
 * Utiliza Prisma para acceder a los datos y JwtService para firmar tokens.
 */
@Injectable()
export class AuthService {
  /**
   * Inicializa el servicio inyectando dependencias requeridas.
   *
   * @param prisma - Cliente de base de datos para consultas de usuarios.
   * @param jwt_service - Utilidad de NestJS para la creación y firma de JWTs.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt_service: JwtService
  ) {}

  /**
   * Valida las credenciales de un usuario y genera un token de acceso (JWT).
   *
   * @param payload - Objeto con el email y contraseña plana recibidos del cliente.
   * @returns Un objeto que contiene el `access_token` firmado y datos básicos del usuario.
   * @throws {UnauthorizedException} Si el usuario no existe o la contraseña es incorrecta.
   *
   * @example
   * const sesion = await authService.login({ email: 'x', password: 'y' });
   */
  async login(payload: LoginDto) {
    const { email, password } = payload;

    // 1. Buscar usuario en la BD incluyendo relaciones necesarias
    // Usamos snake_case para variables locales según AGENTS.md
    const usuario_encontrado = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        empleado: {
          include: {
            sucursales: true, // Necesario para claims de seguridad multi-sucursal
          },
        },
      },
    });

    // 2. Validar existencia del usuario
    if (!usuario_encontrado) {
      // JSDoc nos obliga a documentar que lanzamos esta excepción
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // 3. Validar contraseña usando bcrypt (comparación segura)
    const es_password_valido = await bcrypt.compare(
      password,
      usuario_encontrado.password
    );

    if (!es_password_valido) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    // 4. Preparar el payload del token (claims)
    // Este payload viaja encriptado dentro del token y se usa en el Frontend/Guards
    const token_payload = {
      sub: usuario_encontrado.id,
      email: usuario_encontrado.email,
      roles: ["admin"], // TODO: Conectar con tabla real de roles cuando esté lista
      sucursales:
        usuario_encontrado.empleado?.sucursales.map((s) => s.sucursalId) ?? [],
    };

    // 5. Retornar respuesta de éxito
    return {
      access_token: this.jwt_service.sign(token_payload),
      user: {
        id: usuario_encontrado.id,
        email: usuario_encontrado.email,
        nombre: usuario_encontrado.nombre,
      },
    };
  }
}
