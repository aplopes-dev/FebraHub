import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DealRepository } from './domain/repositories/deal.repository.interface';
import { PrismaDealRepository } from './infrastructure/database/prisma-deal.repository';
import { ListDealsRoute } from './infrastructure/http/routes/list-deals/list-deals.route';
import { GetDealByIdRoute } from './infrastructure/http/routes/get-deal-by-id/get-deal-by-id.route';
import { CreateDealRoute } from './infrastructure/http/routes/create-deal/create-deal.route';
import { UpdateDealRoute } from './infrastructure/http/routes/update-deal/update-deal.route';
import { UpdateDealStageRoute } from './infrastructure/http/routes/update-deal-stage/update-deal-stage.route';
import { DeleteDealRoute } from './infrastructure/http/routes/delete-deal/delete-deal.route';
import { ListDealsUseCase } from './application/use-cases/list-deals/list-deals.use-case';
import { GetDealByIdUseCase } from './application/use-cases/get-deal-by-id/get-deal-by-id.use-case';
import { CreateDealUseCase } from './application/use-cases/create-deal/create-deal.use-case';
import { UpdateDealUseCase } from './application/use-cases/update-deal/update-deal.use-case';
import { UpdateDealStageUseCase } from './application/use-cases/update-deal-stage/update-deal-stage.use-case';
import { DeleteDealUseCase } from './application/use-cases/delete-deal/delete-deal.use-case';
import { FindActiveDealByLeadUseCase } from './application/use-cases/find-active-deal-by-lead/find-active-deal-by-lead.use-case';
import { FindPipelineDealByLeadUseCase } from './application/use-cases/find-pipeline-deal-by-lead/find-pipeline-deal-by-lead.use-case';
import { SyncActiveDealForLeadUseCase } from './application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => LeadsModule),
    PropertiesModule,
    forwardRef(() => TransactionsModule),
  ],
  controllers: [
    ListDealsRoute,
    // `:id/stage` antes de `:id` genérico — Nest registra por ordem de declaração
    // quando paths colidem; rotas distintas (:id/stage vs :id) já são únicas.
    UpdateDealStageRoute,
    GetDealByIdRoute,
    CreateDealRoute,
    UpdateDealRoute,
    DeleteDealRoute,
  ],
  providers: [
    { provide: DealRepository, useClass: PrismaDealRepository },
    ListDealsUseCase,
    GetDealByIdUseCase,
    CreateDealUseCase,
    UpdateDealUseCase,
    UpdateDealStageUseCase,
    DeleteDealUseCase,
    FindActiveDealByLeadUseCase,
    FindPipelineDealByLeadUseCase,
    SyncActiveDealForLeadUseCase,
  ],
  exports: [
    DealRepository,
    FindActiveDealByLeadUseCase,
    FindPipelineDealByLeadUseCase,
    SyncActiveDealForLeadUseCase,
  ],
})
export class DealsModule {}
