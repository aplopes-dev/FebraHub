import { ListTechnicalSheetsUseCase } from './list-technical-sheets.use-case';
import { InMemoryTechnicalSheetRepository } from '../../../tests/in-memory-technical-sheet.repository';
import {
  makeCategory,
  makeProduct,
  STORE_ID,
} from '../../../tests/catalog-test-factory';
import { TechnicalSheet } from '../../../domain/entities/technical-sheet.entity';

describe('ListTechnicalSheetsUseCase', () => {
  it('lista produtos elegíveis com paginação e tabCounts', async () => {
    const repo = new InMemoryTechnicalSheetRepository();
    const category = makeCategory();
    const pizza = makeProduct({ name: 'Pizza', sku: 'PZ-1' }, 'prod-1');
    const supply = makeProduct(
      { name: 'Farinha', sku: 'INS-1', type: 'supply' },
      'supply-1',
    );
    const kit = makeProduct({ name: 'Kit', sku: 'KIT-1' }, 'prod-2');
    repo.seedProduct(pizza, category);
    repo.seedProduct(supply, category);
    repo.seedProduct(kit, category);

    await repo.upsert(
      TechnicalSheet.create(
        {
          organizationId: STORE_ID,
          productId: 'prod-2',
          productionType: 'productive_process',
          maxRemovableComponents: 0,
          markupPercent: 50,
          components: [
            {
              id: 'c1',
              componentProductId: 'supply-1',
              optional: false,
              quantity: 1,
              sortOrder: 0,
            },
          ],
        },
        'sheet-2',
      ),
    );

    const useCase = new ListTechnicalSheetsUseCase(repo);
    const result = await useCase.execute({
      organizationId: STORE_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((row) => row.productId).sort()).toEqual([
      'prod-1',
      'prod-2',
    ]);
    expect(result.tabCounts).toEqual({ all: 2, production: 1 });

    const production = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'production',
    });
    expect(production.total).toBe(1);
    expect(production.items[0]?.productId).toBe('prod-2');
    expect(production.items[0]?.hasComposition).toBe(true);
  });
});
