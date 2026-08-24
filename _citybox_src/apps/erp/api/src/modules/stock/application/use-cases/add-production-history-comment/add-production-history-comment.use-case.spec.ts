import { AddProductionHistoryCommentUseCase } from './add-production-history-comment.use-case';
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

describe('AddProductionHistoryCommentUseCase', () => {
  function setup() {
    const productionOrderRepository = new InMemoryProductionOrderRepository();
    const useCase = new AddProductionHistoryCommentUseCase(
      productionOrderRepository,
    );
    return { useCase, productionOrderRepository };
  }

  async function seedOrder(repos: ReturnType<typeof setup>) {
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

  it('adiciona um comentário à timeline', async () => {
    const repos = setup();
    await seedOrder(repos);

    const entry = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      orderId: ORDER_ID,
      description: 'Aguardando insumos do fornecedor',
      userName: 'Operador',
    });

    expect(entry.kind).toBe('comment');
    expect(entry.description).toBe('Aguardando insumos do fornecedor');

    const history = await repos.productionOrderRepository.listHistory(
      ORGANIZATION_ID,
      ORDER_ID,
    );
    expect(history).toHaveLength(2);
    expect(history[1].kind).toBe('comment');
  });

  it('lança 404 se a ordem não existir', async () => {
    const repos = setup();

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        orderId: 'missing-order',
        description: 'Comentário',
        userName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });
});
