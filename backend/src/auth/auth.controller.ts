import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

/**
 * Controlador encargado de exponer los endpoints públicos de autenticación.
 * Gestiona el inicio de sesión y la emisión de tokens iniciales.
 */
@Controller("auth")
export class AuthController {
  /**
   * Inyecta el servicio de autenticación para delegar la lógica de negocio.
   *
   * @param auth_service - Servicio que contiene la validación de usuarios y firma de tokens.
   */
  constructor(private readonly auth_service: AuthService) {}

  /**
   * Endpoint público para iniciar sesión.
   * Recibe credenciales, las valida y retorna un token de acceso.
   *
   * @param payload - DTO con email y contraseña (validado automáticamente por ValidationPipe).
   * @returns Objeto con el token JWT y datos del usuario.
   *
   * @example
   * POST /api/auth/login
   * Body: { "email": "admin@test.com", "password": "123" }
   */
  @Post("login")
  @HttpCode(HttpStatus.OK) // Por defecto POST devuelve 201, pero Login semánticamente es 200 (OK)
  async login(@Body() payload: LoginDto) {
    // Delegamos al servicio. Si falla, el servicio lanza excepciones (Unauthorized)
    // que NestJS convierte automáticamente en respuestas HTTP 401.
    const respuesta_login = await this.auth_service.login(payload);
    return respuesta_login;
  }
}
