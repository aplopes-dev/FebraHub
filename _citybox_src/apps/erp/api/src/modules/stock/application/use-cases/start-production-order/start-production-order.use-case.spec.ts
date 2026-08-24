import { StartProductionOrderUseCase } from './start-production-order.use-case';
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

describe('StartProductionOrderUseCase', () => {
  function setup() {
    const productionOrderRepository = new InMemoryProductionOrderRepository();
    const useCase = new StartProductionOrderUseCase(productionOrderRepository);
    return { useCase, productionOrderRepository };
  }

  async function seedPendingOrder(repos: ReturnType<typeof setup>) {
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
      ORDER_ID,
    );
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

  it('inicia a produção e registra evento no histórico', async () => {
    const repos = setup();
    await seedPendingOrder(repos);

    const started = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

    expect(started.status).toBe('in_progress');
    expect(started.startedAt).toBeTruthy();

    const history = await repos.productionOrderRepository.listHistory(
      ORGANIZATION_ID,
      ORDER_ID,
    );
    expect(history).toHaveLength(2);
    expect(history[1].title).toBe('Produção iniciada');
  });

  it('bloqueia iniciar ordem que não está pending', async () => {
    const repos = setup();
    await seedPendingOrder(repos);
    await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      userName: 'Operador',
    });

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
