import { CreateSaleOrderUseCase } from './create-sale-order.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { CustomerNotFoundError } from '../../../../customers/domain/errors/customer-not-found.error';
import { InMemoryCustomerRepository } from '../../../../customers/tests/in-memory-customer.repository';
import { makeCustomer } from '../../../../customers/tests/customers-test-factory';
import { StockNotFoundError } from '../../../../stock/domain/errors/stock-not-found.error';
import { ProductNotFoundError } from '../../../../catalog/domain/errors/product-not-found.error';
import { InMemoryStockRepository } from '../../../../stock/tests/in-memory-stock.repository';
import { makeStock } from '../../../../stock/tests/stocks-test-factory';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../../stock/tests/in-memory-stock-movement.repository';
import { InMemorySaleOrderRepository } from '../../../tests/in-memory-sale-order.repository';
import { SaleOrderEmptyLinesError } from '../../../domain/errors/sale-order-empty-lines.error';
import { SaleOrderStockRequiredError } from '../../../domain/errors/sale-order-stock-required.error';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CUSTOMER_ID = 'd1111111-1111-4111-8111-111111111111';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SERVICE_PRODUCT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const MISSING_CUSTOMER = 'e2222222-2222-4222-8222-222222222222';
const MISSING_STOCK = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const MISSING_PRODUCT = '99999999-9999-4999-8999-999999999999';

describe('CreateSaleOrderUseCase', () => {
  function setup() {
    const customerRepository = new InMemoryCustomerRepository();
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const saleOrderRepository = new InMemorySaleOrderRepository(
      stockMovementRepository,
    );

    const useCase = new CreateSaleOrderUseCase(
      saleOrderRepository,
      customerRepository,
      stockRepository,
      stockProductLookup,
    );

    return {
      useCase,
      customerRepository,
      stockRepository,
      stockMovementRepository,
      stockProductLookup,
      saleOrderRepository,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.customerRepository.save(makeCustomer({ id: CUSTOMER_ID }));
    await repos.stockRepository.save(makeStock({ id: STOCK_ID }));
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    repos.stockProductLookup.set({
      id: SERVICE_PRODUCT_ID,
      trackStock: false,
      deletedAt: null,
    });
    repos.stockMovementRepository.setBalance(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
      '10',
    );
  }

  it('cria pedido aberto sem gerar movimento', async () => {
    const repos = setup();
    await seed(repos);

    const saleOrder = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      customerId: CUSTOMER_ID,
      customerName: 'Maria Silva',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '2', unitPriceCents: 500 }],
    });

    expect(saleOrder.status).toBe('open');
    expect(saleOrder.number).toBe(1);
    expect(saleOrder.totalCents).toBe(1000);
    expect(saleOrder.stockMovementId).toBeNull();
    expect(repos.stockMovementRepository.movements.size).toBe(0);
  });

  it('cria pedido fechado e dá baixa no estoque uma única vez', async () => {
    const repos = setup();
    await seed(repos);

    const saleOrder = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      customerId: CUSTOMER_ID,
      customerName: 'Maria Silva',
      stockId: STOCK_ID,
      status: 'closed',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '3', unitPriceCents: 500 }],
    });

    expect(saleOrder.stockMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(1);

    const balance = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balance).toBe('7');
  });

  it('fecha pedido só com serviço (produto não controlado) sem gerar movimento', async () => {
    const repos = setup();
    await seed(repos);

    const saleOrder = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente Balcão',
      status: 'closed',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [
        { productId: SERVICE_PRODUCT_ID, quantity: '1', unitPriceCents: 8000 },
      ],
    });

    expect(saleOrder.stockMovementId).toBeNull();
    expect(repos.stockMovementRepository.movements.size).toBe(0);
  });

  it('bloqueia fechamento de produto controlado sem estoque selecionado', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        status: 'closed',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 500 }],
      }),
    ).rejects.toBeInstanceOf(SaleOrderStockRequiredError);
  });

  it('permite fechar com saldo insuficiente e deixa saldo negativo', async () => {
    const repos = setup();
    await seed(repos);

    const saleOrder = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      customerName: 'Cliente Balcão',
      stockId: STOCK_ID,
      status: 'closed',
      createdByName: 'Operador Teste',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '999', unitPriceCents: 500 }],
    });

    expect(saleOrder.status).toBe('closed');
    expect(saleOrder.stockMovementId).toBeTruthy();

    const balance = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balance).toBe('-989');
  });

  it('bloqueia cliente inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerId: MISSING_CUSTOMER,
        customerName: 'Cliente Fantasma',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 500 }],
      }),
    ).rejects.toBeInstanceOf(CustomerNotFoundError);
  });

  it('bloqueia estoque inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        stockId: MISSING_STOCK,
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', unitPriceCents: 500 }],
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('bloqueia produto inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [
          { productId: MISSING_PRODUCT, quantity: '1', unitPriceCents: 500 },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('bloqueia pedido sem linhas', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [],
      }),
    ).rejects.toBeInstanceOf(SaleOrderEmptyLinesError);
  });

  describe('pagamento em cartão/Pix — dados para o motor de recebíveis', () => {
    it('bloqueia débito sem bandeira', async () => {
      const repos = setup();
      await seed(repos);

      await expect(
        repos.useCase.execute({
          organizationId: ORGANIZATION_ID,
          customerName: 'Cliente Balcão',
          createdByName: 'Operador Teste',
          createdByUserId: USER_ID,
          lines: [
            {
              productId: SERVICE_PRODUCT_ID,
              quantity: '1',
              unitPriceCents: 10000,
            },
          ],
          payments: [
            {
              amountCents: 10000,
              methodId: 'pm-cartao-debito',
              cardPaymentType: 'debit',
            },
          ],
        }),
      ).rejects.toBeInstanceOf(ValidatorDomainError);
    });

    it('bloqueia crédito sem bandeira', async () => {
      const repos = setup();
      await seed(repos);

      await expect(
        repos.useCase.execute({
          organizationId: ORGANIZATION_ID,
          customerName: 'Cliente Balcão',
          createdByName: 'Operador Teste',
          createdByUserId: USER_ID,
          lines: [
            {
              productId: SERVICE_PRODUCT_ID,
              quantity: '1',
              unitPriceCents: 60000,
            },
          ],
          payments: [
            {
              amountCents: 60000,
              methodId: 'pm-cartao-credito',
              cardPaymentType: 'credit',
              installments: 6,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(ValidatorDomainError);
    });

    it('bloqueia parcelas menores que 1', async () => {
      const repos = setup();
      await seed(repos);

      await expect(
        repos.useCase.execute({
          organizationId: ORGANIZATION_ID,
          customerName: 'Cliente Balcão',
          createdByName: 'Operador Teste',
          createdByUserId: USER_ID,
          lines: [
            {
              productId: SERVICE_PRODUCT_ID,
              quantity: '1',
              unitPriceCents: 60000,
            },
          ],
          payments: [
            {
              amountCents: 60000,
              methodId: 'pm-cartao-credito',
              cardPaymentType: 'credit',
              brand: 'Visa',
              installments: 0,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(ValidatorDomainError);
    });

    it('normaliza bandeira do Pix para null mesmo se enviada (RN-11)', async () => {
      const repos = setup();
      await seed(repos);

      const saleOrder = await repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [
          {
            productId: SERVICE_PRODUCT_ID,
            quantity: '1',
            unitPriceCents: 5000,
          },
        ],
        payments: [
          {
            amountCents: 5000,
            methodId: 'pm-pix',
            cardPaymentType: 'pix',
            brand: 'Visa',
          },
        ],
      });

      expect(saleOrder.payments[0].cardPaymentType).toBe('pix');
      expect(saleOrder.payments[0].brand).toBeNull();
    });

    it('persiste bandeira e parcelas de um pagamento em crédito válido', async () => {
      const repos = setup();
      await seed(repos);

      const saleOrder = await repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [
          {
            productId: SERVICE_PRODUCT_ID,
            quantity: '1',
            unitPriceCents: 60000,
          },
        ],
        payments: [
          {
            amountCents: 60000,
            methodId: 'pm-cartao-credito',
            cardPaymentType: 'credit',
            brand: 'Visa',
            installments: 6,
          },
        ],
      });

      expect(saleOrder.payments[0].cardPaymentType).toBe('credit');
      expect(saleOrder.payments[0].brand).toBe('Visa');
      expect(saleOrder.payments[0].installments).toBe(6);
    });

    it('dinheiro/boleto continuam sem cardPaymentType (retrocompatível)', async () => {
      const repos = setup();
      await seed(repos);

      const saleOrder = await repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        customerName: 'Cliente Balcão',
        createdByName: 'Operador Teste',
        createdByUserId: USER_ID,
        lines: [
          {
            productId: SERVICE_PRODUCT_ID,
            quantity: '1',
            unitPriceCents: 5000,
          },
        ],
        payments: [{ amountCents: 5000, methodId: 'pm-dinheiro' }],
      });

      expect(saleOrder.payments[0].cardPaymentType).toBeUndefined();
      expect(saleOrder.payments[0].brand).toBeUndefined();
    });
  });
});
