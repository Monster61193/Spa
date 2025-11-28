import { Module } from '@nestjs/common'
import { PromotionsController } from './promotions.controller'
import { PromotionsService } from './promotions.service'

/**
 * Módulo de promociones y campañas.
 */
@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService]
})
export class PromotionsModule {}
