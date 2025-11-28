import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '../constants/roles'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

/**
 * Evalúa el rol declarado en la cabecera x-user-role con los roles permitidos por el handler.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler())
    if (!roles || roles.length === 0) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const role = request.headers['x-user-role'] as Role | undefined
    if (!role || !roles.includes(role)) {
      throw new ForbiddenException('Rol no autorizado para esta sucursal')
    }
    return true
  }
}
