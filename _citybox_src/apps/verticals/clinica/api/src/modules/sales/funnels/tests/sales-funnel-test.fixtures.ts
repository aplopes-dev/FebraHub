import { CreateSalesFunnelUseCase } from '../application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { DeleteSalesFunnelUseCase } from '../application/use-cases/delete-sales-funnel/delete-sales-funnel.use-case';
import { EnsureDefaultSalesFunnelsUseCase } from '../application/use-cases/ensure-default-sales-funnels/ensure-default-sales-funnels.use-case';
import { GetSalesFunnelUseCase } from '../application/use-cases/get-sales-funnel/get-sales-funnel.use-case';
import { ListSalesFunnelsUseCase } from '../application/use-cases/list-sales-funnels/list-sales-funnels.use-case';
import { UpdateSalesFunnelUseCase } from '../application/use-cases/update-sales-funnel/update-sales-funnel.use-case';
import { InMemorySalesFunnelRepository } from './in-memory-sales-funnel.repository';

export type SalesFunnelTestHarness = {
  repo: InMemorySalesFunnelRepository;
  list: ListSalesFunnelsUseCase;
  get: GetSalesFunnelUseCase;
  create: CreateSalesFunnelUseCase;
  update: UpdateSalesFunnelUseCase;
  delete: DeleteSalesFunnelUseCase;
  ensureDefaults: EnsureDefaultSalesFunnelsUseCase;
};

export function createSalesFunnelTestHarness(): SalesFunnelTestHarness {
  const repo = new InMemorySalesFunnelRepository();
  return {
    repo,
    list: new ListSalesFunnelsUseCase(repo),
    get: new GetSalesFunnelUseCase(repo),
    create: new CreateSalesFunnelUseCase(repo),
    update: new UpdateSalesFunnelUseCase(repo),
    delete: new DeleteSalesFunnelUseCase(repo),
    ensureDefaults: new EnsureDefaultSalesFunnelsUseCase(repo),
  };
}
