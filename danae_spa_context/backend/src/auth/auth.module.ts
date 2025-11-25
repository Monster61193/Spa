import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

/**
 * Módulo responsable de autenticación y tokens.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
