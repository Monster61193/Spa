import { Injectable } from '@nestjs/common'

/**
 * Servicio de autenticación con JWT simulado para demos locales.
 */
@Injectable()
export class AuthService {
  async login(payload: { email: string }) {
    return {
      access_token: `demo-token:${payload.email}`,
      refresh_token: 'refresh-token-demo',
      expires_in: 3600
    }
  }
}
