import { Body, Controller, Post } from '@nestjs/common'
import { z } from 'zod'
import { AuthService } from './auth.service'

const login_schema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
})

/**
 * Auth controller que expone login demo.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth_service: AuthService) {}

  /**
   * Login demo con validación Zod.
   */
  @Post('login')
  async login(@Body() payload: unknown) {
    const parsed = login_schema.parse(payload)
    return this.auth_service.login(parsed)
  }
}
