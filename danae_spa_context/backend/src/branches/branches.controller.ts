import { Controller, Get } from '@nestjs/common'
import { BranchesService } from './branches.service'

/**
 * Endpoints para sucursales habilitadas del usuario.
 */
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  /**
   * Retorna las sucursales asignadas al usuario autenticado.
   */
  @Get('mine')
  async mine() {
    const sucursales = await this.branchesService.listar()
    return { sucursales }
  }
}
