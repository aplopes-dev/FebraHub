import { Module } from '@nestjs/common';
import { TenancyModule } from '../../tenancy/tenancy.module';
import { PromotionsService } from './application/promotions.service';
import { PromotionsController } from './http/promotions.controller';

/** Módulo fino de Promoções — CRUD via Prisma direto + preview stub. */
@Module({
  imports: [TenancyModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
