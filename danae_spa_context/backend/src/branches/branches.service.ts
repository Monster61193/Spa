import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { branches as sample_branches } from '../common/mocks/sample-data'

/**
 * Servicio que abstrae llamadas a sucursales con fallback a mocks para desarrollo.
 */
@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const stored = await this.prisma.sucursal.findMany({ take: 5 })
    if (stored.length > 0) {
      return stored
    }
    return sample_branches
  }
}
