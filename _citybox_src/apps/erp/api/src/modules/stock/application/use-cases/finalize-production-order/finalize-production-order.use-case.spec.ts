import { FinalizeProductionOrderUseCase } from './finalize-production-order.use-case';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderInvalidTransitionError } from '../../../domain/errors/production-order-invalid-transition.error';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { ProductionProductNotEligibleError } from '../../../domain/errors/production-product-not-eligible.error';
import { InMemoryProductionBomLookup } from '../../../tests/in-memory-production-bom.lookup';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { InMemoryStockMovementRepository } from '../../../tests/in-memory-stock-movement.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';
import { Prisma } from '../../../../../../generated/prisma/client';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPONENT_PRODUCT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const ORDER_ID = '99999999-9999-4999-8999-999999999999';

describe('FinalizeProductionOrderUseCase', () => {
  function setup() {
    const productionBomLookup = new InMemoryProductionBomLookup();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const productionOrderRepository = new InMemoryProductionOrderRepository(
      stockMovementRepository,
    );

    const useCase = new FinalizeProductionOrderUseCase(
      productionOrderRepository,
      productionBomLookup,
    );

    return {
      useCase,
      productionBomLookup,
      stockMovementRepository,
      productionOrderRepository,
    };
  }

  function seedBomWithComponents(repos: ReturnType<typeof setup>) {
    repos.productionBomLookup.setEligible(PRODUCT_ID, {
      productName: 'Bolo de Chocolate',
      productSku: 'BOLO-001',
      components: [
        {
          componentProductId: COMPONENT_PRODUCT_ID,
          name: 'Farinha',
          unit: 'kg',
          quantityPerUnit: '0.5',
          unitCostCents: 300,
        },
      ],
    });
  }

  async function seedOrder(
    repos: ReturnType<typeof setup>,
    status: 'pending' | 'in_progress' | 'cancelled' = 'pending',
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
    if (status === 'cancelled') order = order.cancel();

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

  it('finaliza com componentes: gera saída + entrada e atualiza saldos', async () => {
    const repos = setup();
    seedBomWithComponents(repos);
    await seedOrder(repos, 'in_progress');
    repos.stockMovementRepository.balances.set(
      `${SOURCE_STOCK}::${COMPONENT_PRODUCT_ID}`,
      new Prisma.Decimal('10'),
    );

    const finalized = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '8',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    expect(finalized.status).toBe('completed');
    expect(finalized.producedQuantity).toBe('8');
    expect(finalized.outboundMovementId).toBeTruthy();
    expect(finalized.inboundMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(2);

    const sourceQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      SOURCE_STOCK,
      COMPONENT_PRODUCT_ID,
    );
    const destQty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      DEST_STOCK,
      PRODUCT_ID,
    );
    expect(sourceQty).toBe('6');
    expect(destQty).toBe('8');

    const outbound = repos.stockMovementRepository.movements.get(
      finalized.outboundMovementId as string,
    );
    expect(outbound?.lines[0].quantity).toBe('4');
    expect(outbound?.lines[0].costCents).toBe(300);

    const inbound = repos.stockMovementRepository.movements.get(
      finalized.inboundMovementId as string,
    );
    expect(inbound?.lines[0].quantity).toBe('8');
    // custo médio: 4kg * 300 = 1200 / 8 produzidas = 150
    expect(inbound?.lines[0].costCents).toBe(150);

    const history = await repos.productionOrderRepository.listHistory(
      ORGANIZATION_ID,
      ORDER_ID,
    );
    expect(history).toHaveLength(2);
    expect(history[1].title).toBe('Produção finalizada');
  });

  it('finaliza sem componentes: só gera entrada', async () => {
    const repos = setup();
    repos.productionBomLookup.setEligible(PRODUCT_ID, {
      productName: 'Bolo de Chocolate',
      productSku: 'BOLO-001',
      components: [],
    });
    await seedOrder(repos, 'pending');

    const finalized = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '10',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    expect(finalized.outboundMovementId).toBeNull();
    expect(finalized.inboundMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(1);

    const inbound = repos.stockMovementRepository.movements.get(
      finalized.inboundMovementId as string,
    );
    expect(inbound?.lines[0].costCents).toBe(0);
  });

  it('é idempotente se já estiver completed', async () => {
    const repos = setup();
    seedBomWithComponents(repos);
    await seedOrder(repos, 'in_progress');
    repos.stockMovementRepository.balances.set(
      `${SOURCE_STOCK}::${COMPONENT_PRODUCT_ID}`,
      new Prisma.Decimal('10'),
    );

    const first = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '8',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    const second = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '999',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    expect(second.producedQuantity).toBe(first.producedQuantity);
    expect(repos.stockMovementRepository.movements.size).toBe(2);
  });

  it('permite finalizar com insumo insuficiente e deixa saldo negativo', async () => {
    const repos = setup();
    seedBomWithComponents(repos);
    await seedOrder(repos, 'in_progress');
    repos.stockMovementRepository.balances.set(
      `${SOURCE_STOCK}::${COMPONENT_PRODUCT_ID}`,
      new Prisma.Decimal('1'),
    );

    const finalized = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '8',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    expect(finalized.status).toBe('completed');
    // 8 * 0.5 = 4 consumidos; saldo 1 → -3
    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      SOURCE_STOCK,
      COMPONENT_PRODUCT_ID,
    );
    expect(qty).toBe('-3');
  });

  it('bloqueia produto não elegível', async () => {
    const repos = setup();
    repos.productionBomLookup.setNotEligible(PRODUCT_ID, 'Sem ficha técnica.');
    await seedOrder(repos, 'pending');

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: ORDER_ID,
        producedQuantity: '8',
        createdByUserId: USER_ID,
        userName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ProductionProductNotEligibleError);
  });

  it('bloqueia finalizar ordem cancelada', async () => {
    const repos = setup();
    seedBomWithComponents(repos);
    await seedOrder(repos, 'cancelled');

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: ORDER_ID,
        producedQuantity: '8',
        createdByUserId: USER_ID,
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
        producedQuantity: '8',
        createdByUserId: USER_ID,
        userName: 'Operador',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });

  it('finalização concorrente não duplica consumo nem entrada', async () => {
    // A guarda `status === 'completed'` do use-case é lida FORA da transação.
    // Aqui a leitura devolve a ordem ainda em andamento (snapshot obsoleto)
    // enquanto o repositório já a tem concluída — dois cliques simultâneos em
    // "Finalizar Produção".
    const repos = setup();
    seedBomWithComponents(repos);
    const staleInProgress = await seedOrder(repos, 'in_progress');

    // Vencedor da corrida.
    await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '8',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });
    const movementsAfterFirst = repos.stockMovementRepository.movements.size;
    expect(movementsAfterFirst).toBeGreaterThan(0);

    const balanceAfterFirst =
      await repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        DEST_STOCK,
        PRODUCT_ID,
      );

    // Perdedor: entra com o snapshot obsoleto e passa da guarda do use-case.
    jest
      .spyOn(repos.productionOrderRepository, 'findById')
      .mockResolvedValueOnce(staleInProgress);

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
      producedQuantity: '8',
      createdByUserId: USER_ID,
      userName: 'Operador',
    });

    expect(repos.stockMovementRepository.movements.size).toBe(
      movementsAfterFirst,
    );
    expect(result.status).toBe('completed');
    expect(
      await repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        DEST_STOCK,
        PRODUCT_ID,
      ),
    ).toBe(balanceAfterFirst);
  });
});
