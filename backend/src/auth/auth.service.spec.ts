import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

/**
 * Mocks de las dependencias externas para aislar la prueba unitaria.
 * Se definen en snake_case según convención de variables/constantes.
 */
const mock_prisma_service = {
  usuario: {
    findUnique: jest.fn(),
  },
};

const mock_jwt_service = {
  sign: jest.fn(),
};

/**
 * Suite de pruebas unitarias para AuthService.
 * Verifica la lógica de autenticación, manejo de errores y generación de tokens.
 */
describe("AuthService", () => {
  let service: AuthService;
  let prisma: typeof mock_prisma_service;
  let jwt_service: typeof mock_jwt_service;

  /**
   * Configuración inicial del módulo de pruebas.
   * Se ejecuta antes de cada test para reiniciar el estado.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mock_prisma_service },
        { provide: JwtService, useValue: mock_jwt_service },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt_service = module.get(JwtService);
  });

  describe("login", () => {
    /**
     * Caso negativo: El usuario no existe en la base de datos.
     */
    it("debe lanzar UnauthorizedException si el usuario no existe", async () => {
      // Setup: Prisma devuelve null
      mock_prisma_service.usuario.findUnique.mockResolvedValue(null);

      const login_dto = { email: "fantasma@test.com", password: "123" };

      // Ejecución y Assert
      await expect(service.login(login_dto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    /**
     * Caso negativo: El usuario existe pero la contraseña no coincide.
     */
    it("debe lanzar UnauthorizedException si la contraseña es incorrecta", async () => {
      // Setup: Usuario existe, pero la contraseña no coincidirá
      const password_hasheada = await bcrypt.hash("secreto_real", 10);

      mock_prisma_service.usuario.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        password: password_hasheada,
        empleado: { sucursales: [] },
      });

      const login_dto = {
        email: "test@test.com",
        password: "password_incorrecta",
      };

      // Ejecución y Assert
      await expect(service.login(login_dto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    /**
     * Caso positivo: Credenciales válidas generan un token.
     */
    it("debe devolver un access_token si las credenciales son válidas", async () => {
      // 1. Preparación de datos (snake_case)
      const password_real = "123456";
      const password_hasheada = await bcrypt.hash(password_real, 10);

      // 2. Mock de respuesta de Prisma
      mock_prisma_service.usuario.findUnique.mockResolvedValue({
        id: "user-1",
        email: "admin@test.com",
        nombre: "Admin",
        password: password_hasheada,
        empleado: { sucursales: [] },
      });

      // 3. Mock de firma de token
      const token_falso = "token_firmado_falso";
      mock_jwt_service.sign.mockReturnValue(token_falso);

      // 4. Ejecución
      const login_dto = { email: "admin@test.com", password: password_real };
      const resultado = await service.login(login_dto);

      // 5. Verificación
      expect(resultado).toHaveProperty("access_token", token_falso);
      expect(resultado).toHaveProperty("user");
      expect(jwt_service.sign).toHaveBeenCalled();
    });
  });
});
