import { CreateSalesFunnelUseCase } from '../../funnels/application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { InMemorySalesFunnelRepository } from '../../funnels/tests/in-memory-sales-funnel.repository';
import { CreateSalesLabelUseCase } from '../../labels/application/use-cases/create-sales-label/create-sales-label.use-case';
import { InMemorySalesLabelRepository } from '../../labels/tests/in-memory-sales-label.repository';
import { AddSalesOpportunityCommentUseCase } from '../application/use-cases/add-sales-opportunity-comment/add-sales-opportunity-comment.use-case';
import { CreateSalesOpportunityUseCase } from '../application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { DeleteSalesOpportunityUseCase } from '../application/use-cases/delete-sales-opportunity/delete-sales-opportunity.use-case';
import { GetSalesOpportunityUseCase } from '../application/use-cases/get-sales-opportunity/get-sales-opportunity.use-case';
import { ListSalesOpportunitiesUseCase } from '../application/use-cases/list-sales-opportunities/list-sales-opportunities.use-case';
import { ListSalesOpportunityHistoryUseCase } from '../application/use-cases/list-sales-opportunity-history/list-sales-opportunity-history.use-case';
import { MoveSalesOpportunityUseCase } from '../application/use-cases/move-sales-opportunity/move-sales-opportunity.use-case';
import { ReorderSalesOpportunitiesUseCase } from '../application/use-cases/reorder-sales-opportunities/reorder-sales-opportunities.use-case';
import { UpdateSalesOpportunityUseCase } from '../application/use-cases/update-sales-opportunity/update-sales-opportunity.use-case';
import { InMemorySalesOpportunityRepository } from './in-memory-sales-opportunity.repository';

export type SalesOpportunityTestHarness = {
  opportunityRepo: InMemorySalesOpportunityRepository;
  funnelRepo: InMemorySalesFunnelRepository;
  labelRepo: InMemorySalesLabelRepository;
  createFunnel: CreateSalesFunnelUseCase;
  createLabel: CreateSalesLabelUseCase;
  create: CreateSalesOpportunityUseCase;
  get: GetSalesOpportunityUseCase;
  list: ListSalesOpportunitiesUseCase;
  update: UpdateSalesOpportunityUseCase;
  move: MoveSalesOpportunityUseCase;
  reorder: ReorderSalesOpportunitiesUseCase;
  delete: DeleteSalesOpportunityUseCase;
  history: ListSalesOpportunityHistoryUseCase;
  comment: AddSalesOpportunityCommentUseCase;
};

export function createSalesOpportunityTestHarness(): SalesOpportunityTestHarness {
  const opportunityRepo = new InMemorySalesOpportunityRepository();
  const funnelRepo = new InMemorySalesFunnelRepository();
  const labelRepo = new InMemorySalesLabelRepository();

  return {
    opportunityRepo,
    funnelRepo,
    labelRepo,
    createFunnel: new CreateSalesFunnelUseCase(funnelRepo),
    createLabel: new CreateSalesLabelUseCase(labelRepo),
    create: new CreateSalesOpportunityUseCase(
      opportunityRepo,
      funnelRepo,
      labelRepo,
    ),
    get: new GetSalesOpportunityUseCase(opportunityRepo),
    list: new ListSalesOpportunitiesUseCase(opportunityRepo),
    update: new UpdateSalesOpportunityUseCase(
      opportunityRepo,
      funnelRepo,
      labelRepo,
    ),
    move: new MoveSalesOpportunityUseCase(opportunityRepo, funnelRepo),
    reorder: new ReorderSalesOpportunitiesUseCase(opportunityRepo, funnelRepo),
    delete: new DeleteSalesOpportunityUseCase(opportunityRepo),
    history: new ListSalesOpportunityHistoryUseCase(opportunityRepo),
    comment: new AddSalesOpportunityCommentUseCase(opportunityRepo),
  };
}

export const TEST_ACTOR = {
  sub: 'user-1',
  roles: [],
  username: 'alice',
  email: 'alice@example.com',
};
