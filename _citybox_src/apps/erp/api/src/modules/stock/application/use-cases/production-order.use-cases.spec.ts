import { CreateProductionOrderUseCase } from './create-production-order/create-production-order.use-case';
import { ListProductionOrdersUseCase } from './list-production-orders/list-production-orders.use-case';
import { FindProductionOrderByIdUseCase } from './find-production-order-by-id/find-production-order-by-id.use-case';
import { StartProductionOrderUseCase } from './start-production-order/start-production-order.use-case';
import { CancelProductionOrderUseCase } from './cancel-production-order/cancel-production-order.use-case';
import { FinalizeProductionOrderUseCase } from './finalize-production-order/finalize-production-order.use-case';
import { ListProductionHistoryUseCase } from './list-production-history/list-production-history.use-case';
import { AddProductionHistoryCommentUseCase } from './add-production-history-comment/add-production-history-comment.use-case';
import { ProductionProductNotEligibleError } from '../../domain/errors/production-product-not-eligible.error';
import { makeStock } from '../../tests/stocks-test-factory';
import { InMemoryProductionOrderRepository } from '../../tests/in-memory-production-order.repository';
import { InMemoryProductionBomLookup } from '../../tests/in-memory-production-bom.lookup';
import { InMemoryStockRepository } from '../../tests/in-memory-stock.repository';
import { InMemoryStockMovementRepository } from '../../tests/in-memory-stock-movement.repository';
import {
  ORGANIZATION_ID,
  BRANCH_ID,
} from '../../../tenancy/tests/tenancy-test-factory';

const SOURCE_STOCK = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const DEST_STOCK = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SUPPLY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ProductionOrder use cases', () => {
  function setup() {
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const productionOrderRepository = new InMemoryProductionOrderRepository(
      stockMovementRepository,
    );
    const stockRepository = new InMemoryStockRepository();
    const productionBomLookup = new InMemoryProductionBomLookup();

    productionOrderRepository.setProductMeta(PRODUCT_ID, {
      name: 'Kit Casa',
      sku: 'KIT-001',
    });
    productionOrderRepository.setStockName(SOURCE_STOCK, 'Origem');
    productionOrderRepository.setStockName(DEST_STOCK, 'Destino');

    return {
      stockMovementRepository,
      productionOrderRepository,
      stockRepository,
      productionBomLookup,
      create: new CreateProductionOrderUseCase(
        productionOrderRepository,
        stockRepository,
        productionBomLookup,
      ),
      list: new ListProductionOrdersUseCase(productionOrderRepository),
      find: new FindProductionOrderByIdUseCase(
        productionOrderRepository,
        stockRepository,
        productionBomLookup,
      ),
      start: new StartProductionOrderUseCase(productionOrderRepository),
      cancel: new CancelProductionOrderUseCase(productionOrderRepository),
      finalize: new FinalizeProductionOrderUseCase(
        productionOrderRepository,
        productionBomLookup,
      ),
      listHistory: new ListProductionHistoryUseCase(productionOrderRepository),
      addComment: new AddProductionHistoryCommentUseCase(
        productionOrderRepository,
      ),
    };
  }

  async function seedBase(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: SOURCE_STOCK, name: 'Origem', branchIds: [BRANCH_ID] }),
    );
    await repos.stockRepository.save(
      makeStock({ id: DEST_STOCK, name: 'Destino', branchIds: [BRANCH_ID] }),
    );
    repos.productionBomLookup.setEligible(PRODUCT_ID, {
      productName: 'Kit Casa',
      productSku: 'KIT-001',
      components: [
        {
          componentProductId: SUPPLY_ID,
          name: 'Farinha',
          unit: 'kg',
          quantityPerUnit: '0.5',
          unitCostCents: 1250,
        },
      ],
    });
  }

  it('cria pedido pending e lista com tabCounts', async () => {
    const repos = setup();
    await seedBase(repos);

    const order = await repos.create.execute({
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '10',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01'),
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    expect(order.status).toBe('pending');

    const listed = await repos.list.execute({
      organizationId: ORGANIZATION_ID,
      page: 1,
      perPage: 20,
      tab: 'all',
    });
    expect(listed.total).toBe(1);
    expect(listed.tabCounts.pending).toBe(1);
    expect(listed.items[0].productSku).toBe('KIT-001');
  });

  it('rejeita produto não elegível', async () => {
    const repos = setup();
    await seedBase(repos);
    repos.productionBomLookup.setNotEligible(PRODUCT_ID, 'automatic');

    await expect(
      repos.create.execute({
        organizationId: ORGANIZATION_ID,
        productId: PRODUCT_ID,
        plannedQuantity: '1',
        sourceStockId: SOURCE_STOCK,
        destinationStockId: DEST_STOCK,
        expectedDate: new Date('2026-08-01'),
        createdByUserId: USER_ID,
        userName: 'Bruno',
      }),
    ).rejects.toBeInstanceOf(ProductionProductNotEligibleError);
  });

  it('start → finalize gera 2 movimentos e altera saldos (idempotente)', async () => {
    const repos = setup();
    await seedBase(repos);
    repos.stockMovementRepository.setBalance(
      ORGANIZATION_ID,
      SOURCE_STOCK,
      SUPPLY_ID,
      '10',
    );

    const order = await repos.create.execute({
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '4',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01'),
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    await repos.start.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      userName: 'Bruno',
    });

    const completed = await repos.finalize.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      producedQuantity: '4',
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    expect(completed.status).toBe('completed');
    expect(completed.outboundMovementId).toBeTruthy();
    expect(completed.inboundMovementId).toBeTruthy();
    await expect(
      repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        SOURCE_STOCK,
        SUPPLY_ID,
      ),
    ).resolves.toBe('8');
    await expect(
      repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        DEST_STOCK,
        PRODUCT_ID,
      ),
    ).resolves.toBe('4');

    const again = await repos.finalize.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      producedQuantity: '4',
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });
    expect(again.inboundMovementId).toBe(completed.inboundMovementId);
    await expect(
      repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        SOURCE_STOCK,
        SUPPLY_ID,
      ),
    ).resolves.toBe('8');
  });

  it('permite finalize com saldo insuficiente e deixa insumo negativo', async () => {
    const repos = setup();
    await seedBase(repos);

    const order = await repos.create.execute({
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '4',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01'),
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });
    await repos.start.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      userName: 'Bruno',
    });

    const finalized = await repos.finalize.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      producedQuantity: '4',
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    expect(finalized.status).toBe('completed');
    // 4 * 0.5 = 2; saldo inicial 0 → -2
    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      SOURCE_STOCK,
      SUPPLY_ID,
    );
    expect(qty).toBe('-2');
  });

  it('finalize sem BOM só cria entrada', async () => {
    const repos = setup();
    await seedBase(repos);
    repos.productionBomLookup.setEligible(PRODUCT_ID, {
      productName: 'Kit Casa',
      productSku: 'KIT-001',
      components: [],
    });

    const order = await repos.create.execute({
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '2',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01'),
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });
    await repos.start.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      userName: 'Bruno',
    });

    const completed = await repos.finalize.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      producedQuantity: '2',
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    expect(completed.outboundMovementId).toBeNull();
    expect(completed.inboundMovementId).toBeTruthy();
  });

  it('cancel não mexe estoque; find e history funcionam', async () => {
    const repos = setup();
    await seedBase(repos);

    const order = await repos.create.execute({
      organizationId: ORGANIZATION_ID,
      productId: PRODUCT_ID,
      plannedQuantity: '3',
      sourceStockId: SOURCE_STOCK,
      destinationStockId: DEST_STOCK,
      expectedDate: new Date('2026-08-01'),
      createdByUserId: USER_ID,
      userName: 'Bruno',
    });

    const detail = await repos.find.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
    });
    expect(detail.insumos).toHaveLength(1);
    expect(detail.insumos[0].totalQuantity).toBe('1.5');

    await repos.cancel.execute({
      organizationId: ORGANIZATION_ID,
      id: order.id,
      userName: 'Bruno',
    });

    await repos.addComment.execute({
      organizationId: ORGANIZATION_ID,
      orderId: order.id,
      description: 'Motivo do cancelamento',
      userName: 'Bruno',
    });

    const history = await repos.listHistory.execute({
      organizationId: ORGANIZATION_ID,
      orderId: order.id,
    });
    expect(history.some((h) => h.title === 'Pedido criado')).toBe(true);
    expect(history.some((h) => h.kind === 'comment')).toBe(true);
  });
});
