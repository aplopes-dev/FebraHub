import { ListStockTransfersUseCase } from './list-stock-transfers.use-case';
import { StockTransfer } from '../../../domain/entities/stock-transfer.entity';
import { InMemoryStockTransferRepository } from '../../../tests/in-memory-stock-transfer.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const FROM_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TO_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ListStockTransfersUseCase', () => {
  it('lista com paginação e tabCounts', async () => {
    const repo = new InMemoryStockTransferRepository();
    repo.setStockName(FROM_STOCK, 'Origem');
    repo.setStockName(TO_STOCK, 'Destino');

    for (let i = 0; i < 3; i++) {
      const transfer = StockTransfer.create({
        organizationId: ORGANIZATION_ID,
        fromStockId: FROM_STOCK,
        toStockId: TO_STOCK,
        operatedAt: new Date(`2026-07-2${i}T12:00:00.000Z`),
        responsibleName: `Op ${i}`,
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1' }],
      });
      await repo.createWithMovements(
        transfer,
        { id: `out-${i}` } as never,
        { id: `in-${i}` } as never,
      );
    }

    const useCase = new ListStockTransfersUseCase(repo);
    const page1 = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'active',
      page: 1,
      perPage: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.items).toHaveLength(2);
    expect(page1.tabCounts.active).toBe(3);
    expect(page1.totalPages).toBe(2);
  });
});
