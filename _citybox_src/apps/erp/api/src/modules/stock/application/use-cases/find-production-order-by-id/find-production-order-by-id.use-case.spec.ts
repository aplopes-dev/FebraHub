import { FindProductionOrderByIdUseCase } from './find-production-order-by-id.use-case';
import { ProductionOrder } from '../../../domain/entities/production-order.entity';
import { ProductionHistoryEntry } from '../../../domain/entities/production-history-entry.entity';
import { ProductionOrderNotFoundError } from '../../../domain/errors/production-order-not-found.error';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import { InMemoryProductionBomLookup } from '../../../tests/in-memory-production-bom.lookup';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPONENT_PRODUCT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const ORDER_ID = '99999999-9999-4999-8999-999999999999';

describe('FindProductionOrderByIdUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const productionBomLookup = new InMemoryProductionBomLookup();
    const productionOrderRepository = new InMemoryProductionOrderRepository();

    const useCase = new FindProductionOrderByIdUseCase(
      productionOrderRepository,
      stockRepository,
      productionBomLookup,
    );

    return {
      useCase,
      stockRepository,
      productionBomLookup,
      productionOrderRepository,
    };
  }

  async function seedStocksAndBom(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: SOURCE_STOCK, name: 'Insumos' }),
    );
    await repos.stockRepository.save(
      makeStock({ id: DEST_STOCK, name: 'Produtos Acabados' }),
    );
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

  async function createOrder(
    repos: ReturnType<typeof setup>,
    overrides: Partial<{
      plannedQuantity: string;
      producedQuantity: string;
    }> = {},
  ) {
    let order = ProductionOrder.create(
      {
        organizationId: ORGANIZATION_ID,
        productId: PRODUCT_ID,
        plannedQuantity: overrides.plannedQuantity ?? '10',
        sourceStockId: SOURCE_STOCK,
        destinationStockId: DEST_STOCK,
        expectedDate: new Date('2026-08-01T00:00:00.000Z'),
        createdByUserId: USER_ID,
      },
      ORDER_ID,
    );
    if (overrides.producedQuantity) {
      order = order.start().finalize(overrides.producedQuantity);
    }
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

  it('calcula insumos pela quantidade planejada quando pending', async () => {
    const repos = setup();
    await seedStocksAndBom(repos);
    await createOrder(repos, { plannedQuantity: '10' });

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
    });

    expect(result.productName).toBe('Bolo de Chocolate');
    expect(result.productSku).toBe('BOLO-001');
    expect(result.sourceStockName).toBe('Insumos');
    expect(result.destinationStockName).toBe('Produtos Acabados');
    expect(result.insumos).toHaveLength(1);
    expect(result.insumos[0].totalQuantity).toBe('5');
    expect(result.insumos[0].totalCostCents).toBe(1500);
  });

  it('calcula insumos pela quantidade produzida quando finalizada', async () => {
    const repos = setup();
    await seedStocksAndBom(repos);
    await createOrder(repos, { plannedQuantity: '10', producedQuantity: '8' });

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
    });

    expect(result.order.status).toBe('completed');
    expect(result.insumos[0].totalQuantity).toBe('4');
    expect(result.insumos[0].totalCostCents).toBe(1200);
  });

  it('devolve insumos vazio quando a ficha não tem componentes', async () => {
    const repos = setup();
    await seedStocksAndBom(repos);
    repos.productionBomLookup.setEligible(PRODUCT_ID, {
      productName: 'Bolo de Chocolate',
      productSku: 'BOLO-001',
      components: [],
    });
    await createOrder(repos);

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: ORDER_ID,
    });

    expect(result.insumos).toEqual([]);
  });

  it('lança 404 se a ordem não existir', async () => {
    const repos = setup();
    await seedStocksAndBom(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: 'missing-order',
      }),
    ).rejects.toBeInstanceOf(ProductionOrderNotFoundError);
  });
});
