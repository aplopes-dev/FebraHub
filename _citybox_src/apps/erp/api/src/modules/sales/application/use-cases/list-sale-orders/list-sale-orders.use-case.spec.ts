import { CreateSaleOrderUseCase } from '../create-sale-order/create-sale-order.use-case';
import { DeleteSaleOrderUseCase } from '../delete-sale-order/delete-sale-order.use-case';
import { ListSaleOrdersUseCase } from './list-sale-orders.use-case';
import { InMemoryCustomerRepository } from '../../../../customers/tests/in-memory-customer.repository';
import { InMemoryStockRepository } from '../../../../stock/tests/in-memory-stock.repository';
import { makeStock } from '../../../../stock/tests/stocks-test-factory';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../../stock/tests/in-memory-stock-movement.repository';
import { InMemorySaleOrderRepository } from '../../../tests/in-memory-sale-order.repository';
import { InMemoryNfeIssuanceRepository } from '../../../../nfe-issuance/tests/in-memory-nfe-issuance.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ListSaleOrdersUseCase', () => {
  function setup() {
    const customerRepository = new InMemoryCustomerRepository();
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const saleOrderRepository = new InMemorySaleOrderRepository(
      stockMovementRepository,
    );

    const createUseCase = new CreateSaleOrderUseCase(
      saleOrderRepository,
      customerRepository,
      stockRepository,
      stockProductLookup,
    );
    const deleteUseCase = new DeleteSaleOrderUseCase(saleOrderRepository);
    const nfeIssuanceRepository = new InMemoryNfeIssuanceRepository();
    const listUseCase = new ListSaleOrdersUseCase(
      saleOrderRepository,
      nfeIssuanceRepository,
    );

    return {
      createUseCase,
      deleteUseCase,
      listUseCase,
      saleOrderRepository,
      stockRepository,
      stockMovementRepository,
      stockProductLookup,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(makeStock({ id: STOCK_ID }));
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    repos.stockMovementRepository.setBalance(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
      '100',
    );
  }

  it('lista com contadores de aba, filtro por situação e valor', async () => {
    const repos = setup();
    await seed(repos);

    const open = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente A',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 1000 }],
    });
    const closed = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente B',
      stockId: STOCK_ID,
      status: 'closed',
      channelId: 'delivery',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 5000 }],
    });

    const all = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
    });
    expect(all.total).toBe(2);
    expect(all.tabCounts).toEqual({ open: 2, deleted: 0 });

    const onlyClosed = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      statuses: ['closed'],
    });
    expect(onlyClosed.total).toBe(1);
    expect(onlyClosed.items[0].saleOrder.id).toBe(closed.id);

    const byAmount = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      amountMinCents: 5000,
    });
    expect(byAmount.total).toBe(1);
    expect(byAmount.items[0].saleOrder.id).toBe(closed.id);

    const byChannel = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      channelId: 'delivery',
    });
    expect(byChannel.total).toBe(1);
    expect(byChannel.items[0].saleOrder.id).toBe(closed.id);

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: open.id,
    });

    const activeAfterDelete = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
    });
    expect(activeAfterDelete.total).toBe(1);
    expect(activeAfterDelete.tabCounts).toEqual({ open: 1, deleted: 1 });

    const deletedTab = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });
    expect(deletedTab.total).toBe(1);
    expect(deletedTab.items[0].saleOrder.id).toBe(open.id);
  });

  it('ordena por valor decrescente', async () => {
    const repos = setup();
    await seed(repos);

    const cheap = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente A',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 1000 }],
    });
    const expensive = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente B',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 9000 }],
    });

    const result = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      sort: 'amount_desc',
    });

    expect(result.items.map((item) => item.saleOrder.id)).toEqual([
      expensive.id,
      cheap.id,
    ]);
  });
});
