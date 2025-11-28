import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

/**
 * Valida que la petición incluya la cabecera X-Branch-Id y la registra en request.branch_id.
 */
@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const branch_id = request.headers['x-branch-id']
    if (!branch_id) {
      throw new UnauthorizedException('Cabecera X-Branch-Id es obligatoria')
    }
    request.branchId = branch_id
    return true
  }
}
