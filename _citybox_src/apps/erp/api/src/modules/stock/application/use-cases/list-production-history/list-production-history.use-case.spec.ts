import { ListProductionHistoryUseCase } from './list-production-history.use-case';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const ORDER_ID = '99999999-9999-4999-8999-999999999999';

describe('ListProductionHistoryUseCase', () => {
  function setup() {
    const productionOrderRepository = new InMemoryProductionOrderRepository();
    const useCase = new ListProductionHistoryUseCase(productionOrderRepository);
    return { useCase, productionOrderRepository };
  }

  async function seedOrderWithHistory(repos: ReturnType<typeof setup>) {
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
    await repos.productionOrderRepository.addHistory(
      ORGANIZATION_ID,
      order.id,
      ProductionHistoryEntry.create({
        organizationId: ORGANIZATION_ID,
        productionOrderId: order.id,
        kind: 'comment',
        title: 'Comentário',
        description: 'Aguardando insumos',
        userName: 'Operador',
      }),
    );
    return order;
  }

  it('lista a timeline em ordem cronológica', async () => {
    const repos = setup();
    await seedOrderWithHistory(repos);

    const history = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      orderId: ORDER_ID,
    });

    expect(history).toHaveLength(2);
    expect(history[0].title).toBe('Pedido criado');
    expect(history[1].title).toBe('Comentário');
    expect(history[1].description).toBe('Aguardando insumos');
  });

  it('lança 404 se a ordem não existir', async () => {
    const repos = setup();

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        orderId: 'missing-order',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });
});
