import { Module } from '@nestjs/common';

import { SalesFunnelsModule } from '../funnels/funnels.module';
import { SalesLabelsModule } from '../labels/labels.module';
import { AddSalesOpportunityCommentUseCase } from './application/use-cases/add-sales-opportunity-comment/add-sales-opportunity-comment.use-case';
import { CreateSalesOpportunityUseCase } from './application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { DeleteSalesOpportunityUseCase } from './application/use-cases/delete-sales-opportunity/delete-sales-opportunity.use-case';
import { GetSalesOpportunityUseCase } from './application/use-cases/get-sales-opportunity/get-sales-opportunity.use-case';
import { ListSalesOpportunitiesUseCase } from './application/use-cases/list-sales-opportunities/list-sales-opportunities.use-case';
import { ListSalesOpportunityHistoryUseCase } from './application/use-cases/list-sales-opportunity-history/list-sales-opportunity-history.use-case';
import { MoveSalesOpportunityUseCase } from './application/use-cases/move-sales-opportunity/move-sales-opportunity.use-case';
import { ReorderSalesOpportunitiesUseCase } from './application/use-cases/reorder-sales-opportunities/reorder-sales-opportunities.use-case';
import { UpdateSalesOpportunityUseCase } from './application/use-cases/update-sales-opportunity/update-sales-opportunity.use-case';
import { SalesOpportunityRepository } from './domain/repositories/sales-opportunity.repository';
import { PrismaSalesOpportunityRepository } from './infrastructure/database/prisma-sales-opportunity.repository';
import { SalesOpportunitiesRoute } from './infrastructure/http/routes/sales-opportunities.route';

@Module({
  imports: [SalesFunnelsModule, SalesLabelsModule],
  controllers: [SalesOpportunitiesRoute],
  providers: [
    {
      provide: SalesOpportunityRepository,
      useClass: PrismaSalesOpportunityRepository,
    },
    ListSalesOpportunitiesUseCase,
    GetSalesOpportunityUseCase,
    CreateSalesOpportunityUseCase,
    UpdateSalesOpportunityUseCase,
    MoveSalesOpportunityUseCase,
    ReorderSalesOpportunitiesUseCase,
    DeleteSalesOpportunityUseCase,
    ListSalesOpportunityHistoryUseCase,
    AddSalesOpportunityCommentUseCase,
  ],
  exports: [SalesOpportunityRepository, CreateSalesOpportunityUseCase],
})
export class SalesOpportunitiesModule {}
