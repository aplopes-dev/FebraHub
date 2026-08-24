import { ListInventoriesUseCase } from './list-inventories.use-case';
import { Inventory } from '../../../domain/entities/inventory.entity';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryInventoryRepository } from '../../../tests/in-memory-inventory.repository';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PRODUCT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('ListInventoriesUseCase', () => {
  it('lista por stockId com paginação', async () => {
    const stockRepository = new InMemoryStockRepository();
    const inventoryRepository = new InMemoryInventoryRepository();
    await stockRepository.save(
      makeStock({ id: STOCK_ID, branchIds: [BRANCH_ID] }),
    );

    for (let i = 0; i < 3; i++) {
      await inventoryRepository.createCompletedWithAdjustments(
        Inventory.create({
          organizationId: ORGANIZATION_ID,
          stockId: STOCK_ID,
          name: `Inv ${i}`,
          lines: [
            {
              productId: PRODUCT_A,
              systemQuantity: '1',
              countedQuantity: '1',
            },
          ],
        }),
        [],
      );
    }

    const useCase = new ListInventoriesUseCase(
      inventoryRepository,
      stockRepository,
    );

    const page1 = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      page: 1,
      perPage: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page1.totalPages).toBe(2);
  });
});
