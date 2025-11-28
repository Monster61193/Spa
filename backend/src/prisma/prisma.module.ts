import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/**
 * Módulo reutilizable que expone PrismaService.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
