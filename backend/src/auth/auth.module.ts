import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module";

/**
 * Módulo de Autenticación.
 * Configura la estrategia JWT y expone los servicios de seguridad.
 */
@Module({
  imports: [
    // Importamos PrismaModule para poder usar PrismaService dentro de AuthService
    PrismaModule,
    // Configuramos JWT de forma asíncrona para leer variables de entorno (.env)
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => ({
        secret: config_service.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "8h" }, // El token dura 8 horas (jornada laboral típica)
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule], // Exportamos JwtModule por si otros módulos quieren validar tokens
})
export class AuthModule {}
