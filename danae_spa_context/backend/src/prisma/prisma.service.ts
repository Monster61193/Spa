import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Wrapper sobre PrismaClient para usar con inyección de dependencias.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ log: ['query'] })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
