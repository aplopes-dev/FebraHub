import { CreateSalesLabelUseCase } from '../application/use-cases/create-sales-label/create-sales-label.use-case';
import { DeleteSalesLabelUseCase } from '../application/use-cases/delete-sales-label/delete-sales-label.use-case';
import { ListSalesLabelsUseCase } from '../application/use-cases/list-sales-labels/list-sales-labels.use-case';
import { UpdateSalesLabelUseCase } from '../application/use-cases/update-sales-label/update-sales-label.use-case';
import { InMemorySalesLabelRepository } from './in-memory-sales-label.repository';

export type SalesLabelTestHarness = {
  repo: InMemorySalesLabelRepository;
  list: ListSalesLabelsUseCase;
  create: CreateSalesLabelUseCase;
  update: UpdateSalesLabelUseCase;
  delete: DeleteSalesLabelUseCase;
};

export function createSalesLabelTestHarness(): SalesLabelTestHarness {
  const repo = new InMemorySalesLabelRepository();
  return {
    repo,
    list: new ListSalesLabelsUseCase(repo),
    create: new CreateSalesLabelUseCase(repo),
    update: new UpdateSalesLabelUseCase(repo),
    delete: new DeleteSalesLabelUseCase(repo),
  };
}
