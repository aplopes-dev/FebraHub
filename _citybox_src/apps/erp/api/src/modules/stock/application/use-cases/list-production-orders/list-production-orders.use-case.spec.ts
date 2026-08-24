import { ListProductionOrdersUseCase } from './list-production-orders.use-case';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

function makeOrder(overrides: {
  id: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}) {
  const order = ProductionOrder.create(
    {
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '10',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01T00:00:00.000Z'),
      createdByUserId: USER_ID,
    },
    overrides.id,
  );
  if (overrides.status === 'in_progress') return order.start();
  if (overrides.status === 'cancelled') return order.cancel();
  if (overrides.status === 'completed') return order.start().finalize('10');
  return order;
}

describe('ListProductionOrdersUseCase', () => {
  function setup() {
    const productionOrderRepository = new InMemoryProductionOrderRepository();
    const useCase = new ListProductionOrdersUseCase(productionOrderRepository);
    return { useCase, productionOrderRepository };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    repos.productionOrderRepository.setProductMeta(PRODUCT_ID, {
      name: 'Bolo de Chocolate',
      sku: 'BOLO-001',
    });
    repos.productionOrderRepository.setStockName(SOURCE_STOCK, 'Insumos');
    repos.productionOrderRepository.setStockName(
      DEST_STOCK,
      'Produtos Acabados',
    );

    const orderIds = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
    ];
    const statuses = [
      'pending',
      'in_progress',
      'completed',
      'cancelled',
    ] as const;

    for (let i = 0; i < orderIds.length; i++) {
      const order = makeOrder({ id: orderIds[i], status: statuses[i] });
      await repos.productionOrderRepository.create(
        order,
        ProductionHistoryEntry.create({
          organizationId: ORGANIZATION_ID,
          productionOrderId: order.id,
          kind: 'system',
          title: 'Pedido criado',
          userName: 'Operador',
        }),
      );
    }
  }

  it('lista todas as ordens com nomes e paginação', async () => {
    const repos = setup();
    await seed(repos);

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
    });

    expect(result.total).toBe(4);
    expect(result.items).toHaveLength(4);
    expect(result.items[0].productName).toBe('Bolo de Chocolate');
    expect(result.items[0].productSku).toBe('BOLO-001');
    expect(result.items[0].sourceStockName).toBe('Insumos');
    expect(result.items[0].destinationStockName).toBe('Produtos Acabados');
    expect(result.tabCounts).toEqual({
      all: 4,
      pending: 1,
      in_progress: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  it('filtra pela aba', async () => {
    const repos = setup();
    await seed(repos);

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'completed',
    });

    expect(result.total).toBe(1);
    expect(result.items[0].order.status).toBe('completed');
    // tabCounts ignora o filtro de aba.
    expect(result.tabCounts.all).toBe(4);
  });

  it('filtra pela busca (nome/sku do produto)', async () => {
    const repos = setup();
    await seed(repos);

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'BOLO-001',
    });

    expect(result.total).toBe(4);
  });
});
