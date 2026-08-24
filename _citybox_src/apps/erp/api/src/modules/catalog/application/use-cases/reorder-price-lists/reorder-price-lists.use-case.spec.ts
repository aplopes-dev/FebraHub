import { ReorderPriceListsUseCase } from './reorder-price-lists.use-case';
import { InMemoryPriceListRepository } from '../../../tests/in-memory-price-list.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';
import { PriceList } from '../../../domain/entities/price-list.entity';

describe('ReorderPriceListsUseCase', () => {
  it('aplica a ordem informada', async () => {
    const repo = new InMemoryPriceListRepository();
    const useCase = new ReorderPriceListsUseCase(repo);

    await repo.save(
      PriceList.create(
        {
          organizationId: STORE_ID,
          name: 'A',
          adjustmentType: 'manual',
          priority: 0,
        },
        'a',
      ),
    );
    await repo.save(
      PriceList.create(
        {
          organizationId: STORE_ID,
          name: 'B',
          adjustmentType: 'manual',
          priority: 1,
        },
        'b',
      ),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      orderedIds: ['b', 'a'],
    });

    expect(result.map((list) => list.id)).toEqual(['b', 'a']);
    expect(result[0].priority).toBe(0);
    expect(result[1].priority).toBe(1);
  });
});
