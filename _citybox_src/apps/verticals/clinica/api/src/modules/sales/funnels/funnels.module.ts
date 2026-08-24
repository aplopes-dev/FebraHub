import { Module } from '@nestjs/common';

import { CreateSalesFunnelUseCase } from './application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { DeleteSalesFunnelUseCase } from './application/use-cases/delete-sales-funnel/delete-sales-funnel.use-case';
import { EnsureDefaultSalesFunnelsUseCase } from './application/use-cases/ensure-default-sales-funnels/ensure-default-sales-funnels.use-case';
import { GetSalesFunnelUseCase } from './application/use-cases/get-sales-funnel/get-sales-funnel.use-case';
import { ListSalesFunnelsUseCase } from './application/use-cases/list-sales-funnels/list-sales-funnels.use-case';
import { UpdateSalesFunnelUseCase } from './application/use-cases/update-sales-funnel/update-sales-funnel.use-case';
import { SalesFunnelRepository } from './domain/repositories/sales-funnel.repository';
import { PrismaSalesFunnelRepository } from './infrastructure/database/prisma-sales-funnel.repository';
import { SalesFunnelsRoute } from './infrastructure/http/routes/sales-funnels.route';

@Module({
  controllers: [SalesFunnelsRoute],
  providers: [
    { provide: SalesFunnelRepository, useClass: PrismaSalesFunnelRepository },
    ListSalesFunnelsUseCase,
    GetSalesFunnelUseCase,
    CreateSalesFunnelUseCase,
    UpdateSalesFunnelUseCase,
    DeleteSalesFunnelUseCase,
    EnsureDefaultSalesFunnelsUseCase,
  ],
  exports: [
    SalesFunnelRepository,
    GetSalesFunnelUseCase,
    ListSalesFunnelsUseCase,
    EnsureDefaultSalesFunnelsUseCase,
  ],
})
export class SalesFunnelsModule {}
