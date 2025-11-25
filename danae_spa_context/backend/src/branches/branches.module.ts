import { Module } from '@nestjs/common'
import { BranchesController } from './branches.controller'
import { BranchesService } from './branches.service'
import { PrismaModule } from '../prisma/prisma.module'

/**
 * Módulo que expone controladores y servicios de sucursales.
 */
@Module({
  imports: [PrismaModule],
  controllers: [BranchesController],
  providers: [BranchesService]
})
export class BranchesModule {}
