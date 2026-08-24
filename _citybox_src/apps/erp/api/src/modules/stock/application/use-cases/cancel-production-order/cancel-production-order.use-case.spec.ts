import { CancelProductionOrderUseCase } from './cancel-production-order.use-case';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderInvalidTransitionError } from '../../../domain/errors/production-order-invalid-transition.error';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const ORDER_ID = '99999999-9999-4999-8999-999999999999';

describe('CancelProductionOrderUseCase', () => {
  function setup() {
    const productionOrderRepository = new InMemoryProductionOrderRepository();
    const useCase = new CancelProductionOrderUseCase(productionOrderRepository);
    return { useCase, productionOrderRepository };
  }

  async function seedOrder(
    repos: ReturnType<typeof setup>,
    status: 'pending' | 'in_progress' | 'completed' = 'pending',
  ) {
    let order = ProductionOrder.create(
      {
        organizationId: ORGANIZATION_ID,
        productId: PRODUCT_ID,
        plannedQuantity: '10',
        sourceStockId: SOURCE_STOCK,
        destinationStockId: DEST_STOCK,
        expectedDate: new Date('2026-08-01T00:00:00.000Z'),
        createdByUserId: USER_ID,
      },
      ORDER_ID,
    );
    if (status === 'in_progress') order = order.start();
    if (status === 'completed') order = order.start().finalize('10');

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
    return order;
  }

  it('cancela ordem pending', async () => {
    const repos = setup();
    await seedOrder(repos, 'pending');

    const cancelled = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeTruthy();
  });

  it('cancela ordem in_progress', async () => {
    const repos = setup();
    await seedOrder(repos, 'in_progress');

    const cancelled = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

    expect(cancelled.status).toBe('cancelled');
  });

  it('é idempotente se já estiver cancelled', async () => {
    const repos = setup();
    await seedOrder(repos, 'pending');
    await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

    const again = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

    expect(again.status).toBe('cancelled');
    const history = await repos.productionOrderRepository.listHistory(
      ORGANIZATION_ID,
      ORDER_ID,
    );
    // 1 criação + 1 cancelamento — o segundo cancel não gera novo evento.
    expect(history).toHaveLength(2);
  });

  it('bloqueia cancelar ordem já completed', async () => {
    const repos = setup();
    await seedOrder(repos, 'completed');

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: ORDER_ID,
        userName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderInvalidTransitionError);
  });

  it('lança 404 se a ordem não existir', async () => {
    const repos = setup();

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: 'missing-order',
        userName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });
});
