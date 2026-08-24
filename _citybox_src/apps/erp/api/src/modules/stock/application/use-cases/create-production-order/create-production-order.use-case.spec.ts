import { CreateProductionOrderUseCase } from './create-production-order.use-case';
import { ProductionInvalidQuantityError } from '../../../domain/errors/production-invalid-quantity.error';
import { ProductionProductNotEligibleError } from '../../../domain/errors/production-product-not-eligible.error';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import { InMemoryProductionBomLookup } from '../../../tests/in-memory-production-bom.lookup';
import { InMemoryProductionOrderRepository } from '../../../tests/in-memory-production-order.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MISSING_PRODUCT_ID = 'a1111111-1111-4111-8111-111111111111';
const NOT_ELIGIBLE_PRODUCT_ID = 'a2222222-2222-4222-8222-222222222222';
const COMPONENT_PRODUCT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MISSING_STOCK = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('CreateProductionOrderUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const productionBomLookup = new InMemoryProductionBomLookup();
    const productionOrderRepository = new InMemoryProductionOrderRepository();

    const useCase = new CreateProductionOrderUseCase(
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

  async function seed(repos: ReturnType<typeof setup>) {
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
    repos.productionBomLookup.setNotEligible(
      NOT_ELIGIBLE_PRODUCT_ID,
      'Produto não possui ficha técnica de produção.',
    );
  }

  function baseInput(
    overrides: Partial<
      Parameters<CreateProductionOrderUseCase['execute']>[0]
    > = {},
  ) {
    return {
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '10',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01T00:00:00.000Z'),
      createdByUserId: USER_ID,
      userName: 'Operador',
      ...overrides,
    };
  }

  it('cria ordem pending com histórico "Pedido criado"', async () => {
    const repos = setup();
    await seed(repos);

    const order = await repos.useCase.execute(baseInput());

    expect(order.status).toBe('pending');
    expect(order.plannedQuantity).toBe('10');
    expect(order.producedQuantity).toBeNull();
    expect(order.outboundMovementId).toBeNull();
    expect(order.inboundMovementId).toBeNull();

    const history = await repos.productionOrderRepository.listHistory(
      ORGANIZATION_ID,
      order.id,
    );
    expect(history).toHaveLength(1);
    expect(history[0].title).toBe('Pedido criado');
    expect(history[0].kind).toBe('system');
  });

  it('bloqueia estoque de origem inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute(baseInput({ sourceStockId: MISSING_STOCK })),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('bloqueia estoque de destino inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute(baseInput({ destinationStockId: MISSING_STOCK })),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('bloqueia produto inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute(baseInput({ productId: MISSING_PRODUCT_ID })),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('bloqueia produto não elegível para produção', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute(baseInput({ productId: NOT_ELIGIBLE_PRODUCT_ID })),
    ).rejects.toBeInstanceOf(ProductionProductNotEligibleError);
  });

  it('bloqueia quantidade planejada inválida', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute(baseInput({ plannedQuantity: '0' })),
    ).rejects.toBeInstanceOf(ProductionInvalidQuantityError);
  });
});
