import { CreateSaleOrderUseCase } from '../../../../sales/application/use-cases/create-sale-order/create-sale-order.use-case';
import { InMemorySaleOrderRepository } from '../../../../sales/tests/in-memory-sale-order.repository';
import { InMemoryCustomerRepository } from '../../../../customers/tests/in-memory-customer.repository';
import { PaymentMethod } from '../../../../finance/payment-methods/domain/entities/payment-method.entity';
import { InMemoryPaymentMethodRepository } from '../../../../finance/payment-methods/tests/in-memory-payment-method.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
  makeRepositories as makeTenancyRepositories,
  MEMBERSHIP_ID,
  USER_ID,
  makeMembership,
  makeUser,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { InMemoryStockRepository } from '../../../../stock/tests/in-memory-stock.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../../stock/tests/in-memory-stock-movement.repository';
import { makeStock } from '../../../../stock/tests/stocks-test-factory';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import type { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PosCashSession } from '../../../../pos-cash-sessions/domain/entities/pos-cash-session.entity';
import { InMemoryPosCashSessionRepository } from '../../../../pos-cash-sessions/tests/in-memory-pos-cash-session.repository';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { PosPolicy } from '../../../../pos-policies/domain/entities/pos-policy.entity';
import { InMemoryPosPolicyRepository } from '../../../../pos-policies/tests/in-memory-pos-policy.repository';
import { InMemoryBankStatementMatchRepository } from '../../../../finance/bank-reconciliation/tests/in-memory-bank-statement-match.repository';
import { BankStatementMatch } from '../../../../finance/bank-reconciliation/domain/entities/bank-statement-match.entity';
import type { FinancialEntryRepository } from '../../../../finance/financial-entries/domain/repositories/financial-entry.repository.interface';
import { CreatePosSaleUseCase } from '../create-pos-sale/create-pos-sale.use-case';
import {
  CancelPosSaleUseCase,
  PDV_VENDA_CANCEL_PERMISSION,
} from './cancel-pos-sale.use-case';
import { PosSaleCancelForbiddenError } from '../../../domain/errors/pos-sale-cancel-forbidden.error';
import { PosSaleCashSessionRequiredError } from '../../../domain/errors/pos-sale-cash-session-required.error';
import { PosSaleReceivablesInUseError } from '../../../domain/errors/pos-sale-receivables-in-use.error';
import { PosSaleSupervisorRequiredError } from '../../../domain/errors/pos-sale-supervisor-required.error';
import { PDV_ALCADA_AUTHORIZE_PERMISSION } from '../../../../../shared/infra/http/permissions/permission-catalog';
import { InMemoryPosDeliveryOrderRepository } from '../../../../pos-delivery/tests/in-memory-pos-delivery-order.repository';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const METHOD_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PROFILE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TERMINAL_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const SESSION_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const SUPERVISOR_USER = '11111111-1111-4111-8111-111111111111';
const SUPERVISOR_MEMBERSHIP = '22222222-2222-4222-8222-222222222222';
const SUPERVISOR_PROFILE = '33333333-3333-4333-8333-333333333333';
const FE_ID = '44444444-4444-4444-8444-444444444444';

describe('CancelPosSaleUseCase', () => {
  async function setup(options?: {
    trackStock?: boolean;
    cancelPermission?: boolean;
    cancellationRequiresSupervisor?: boolean;
    withOpenSession?: boolean;
    financialEntryIds?: string[];
  }) {
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const deliveryOrderRepository = new InMemoryPosDeliveryOrderRepository();
    const saleOrderRepository = new InMemorySaleOrderRepository(
      stockMovementRepository,
      deliveryOrderRepository,
    );
    const customerRepository = new InMemoryCustomerRepository();
    const stockRepository = new InMemoryStockRepository();
    const paymentMethodRepository = new InMemoryPaymentMethodRepository();
    const cashSessionRepository = new InMemoryPosCashSessionRepository();
    const tenancy = makeTenancyRepositories();
    const posPolicyRepository = new InMemoryPosPolicyRepository();
    const getPosPolicy = new GetPosPolicyUseCase(posPolicyRepository);
    const bankStatementMatchRepository =
      new InMemoryBankStatementMatchRepository();
    const softDelete = jest.fn().mockResolvedValue(undefined);
    const financialEntryRepository = {
      softDelete,
    } as unknown as FinancialEntryRepository;

    const financialEntryIds = options?.financialEntryIds ?? [];
    const deliveryUpdate = jest.fn().mockResolvedValue({});
    const deliveryFindFirst = jest.fn().mockResolvedValue({
      fulfillment: 'pickup',
      status: 'delivered',
    });
    const tx = {
      saleOrder: {
        update: jest.fn().mockResolvedValue({}),
      },
      posDeliveryOrder: {
        findFirst: deliveryFindFirst,
        update: deliveryUpdate,
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      scoped: {
        saleOrder: {
          findFirst: jest.fn(
            async (args: {
              where?: {
                posDeliveryOrderId?: string;
                status?: unknown;
              };
              select?: { id?: true; posTerminalId?: true };
            }) => {
              // CreatePosSale: bloqueio de venda ativa no delivery.
              if (args?.where?.status != null && args?.where?.posDeliveryOrderId) {
                const saleId =
                  deliveryOrderRepository.activeSaleByDeliveryId.get(
                    args.where.posDeliveryOrderId,
                  );
                return saleId ? { id: saleId } : null;
              }
              // CancelPosSale: meta do POS na SaleOrder.
              return {
                posTerminalId: TERMINAL_ID,
                posDeliveryOrderId: null as string | null,
              };
            },
          ),
          update: jest.fn().mockResolvedValue({}),
        },
        financialEntry: {
          findMany: jest
            .fn()
            .mockResolvedValue(financialEntryIds.map((id) => ({ id }))),
        },
        posDeliveryOrder: tx.posDeliveryOrder,
        $transaction: jest.fn(
          async (callback: (client: typeof tx) => Promise<unknown>) =>
            callback(tx),
        ),
      },
    } as unknown as PrismaService;

    const createSaleOrder = new CreateSaleOrderUseCase(
      saleOrderRepository,
      customerRepository,
      stockRepository,
      stockProductLookup,
    );
    const createPosSale = new CreatePosSaleUseCase(
      createSaleOrder,
      paymentMethodRepository,
      stockRepository,
      tenancy.membershipRepository,
      cashSessionRepository,
      deliveryOrderRepository,
      getPosPolicy,
      prisma,
    );
    const cancelPosSale = new CancelPosSaleUseCase(
      saleOrderRepository,
      stockMovementRepository,
      cashSessionRepository,
      tenancy.membershipRepository,
      getPosPolicy,
      financialEntryRepository,
      bankStatementMatchRepository,
      prisma,
    );

    await paymentMethodRepository.save(
      PaymentMethod.create(
        {
          organizationId: ORGANIZATION_ID,
          name: 'PIX',
          systemKey: 'pm-pix',
        },
        METHOD_ID,
      ),
    );
    await stockRepository.save(
      makeStock({
        id: STOCK_ID,
        isDefault: true,
        branchIds: [BRANCH_ID],
      }),
    );
    stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: options?.trackStock ?? false,
      deletedAt: null,
    });
    await tenancy.seedOwner();

    const permissionIds = ['pdv.operacao.venda.create'];
    if (options?.cancelPermission !== false) {
      permissionIds.push(PDV_VENDA_CANCEL_PERMISSION);
    }
    tenancy.membershipRepository.registerPermissionProfile({
      id: PROFILE_ID,
      name: 'Caixa',
      systemKey: 'caixa',
      permissionIds,
    });
    await tenancy.userRepository.save(
      makeUser({ id: USER_ID, name: 'Maria Caixa' }),
    );
    await tenancy.membershipRepository.save(
      makeMembership({
        id: MEMBERSHIP_ID,
        userId: USER_ID,
        permissionProfileId: PROFILE_ID,
        pdvCode: '01',
        pdvPinHash: await PinHasher.hash('1234'),
      }),
    );
    await tenancy.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
      [BRANCH_ID],
    );

    tenancy.membershipRepository.registerPermissionProfile({
      id: SUPERVISOR_PROFILE,
      name: 'Gerente',
      systemKey: 'gerente',
      permissionIds: [PDV_ALCADA_AUTHORIZE_PERMISSION],
    });
    await tenancy.userRepository.save(
      makeUser({ id: SUPERVISOR_USER, name: 'Ana Gerente' }),
    );
    await tenancy.membershipRepository.save(
      makeMembership({
        id: SUPERVISOR_MEMBERSHIP,
        userId: SUPERVISOR_USER,
        permissionProfileId: SUPERVISOR_PROFILE,
        pdvCode: '99',
        pdvPinHash: await PinHasher.hash('9999'),
      }),
    );

    if (options?.cancellationRequiresSupervisor === false) {
      await posPolicyRepository.save(
        PosPolicy.createDefault(ORGANIZATION_ID).update({
          cancellationRequiresSupervisor: false,
        }),
      );
    }

    if (options?.withOpenSession !== false) {
      await cashSessionRepository.save(
        PosCashSession.create(
          {
            organizationId: ORGANIZATION_ID,
            branchId: BRANCH_ID,
            posTerminalId: TERMINAL_ID,
            openedByUserId: USER_ID,
            openedByName: 'Maria Caixa',
            openingFloatCents: 0,
          },
          SESSION_ID,
        ),
      );
    }

    return {
      createPosSale,
      cancelPosSale,
      saleOrderRepository,
      stockMovementRepository,
      cashSessionRepository,
      deliveryOrderRepository,
      softDelete,
      bankStatementMatchRepository,
      prisma,
      deliveryUpdate,
      deliveryFindFirst,
    };
  }

  async function createSale(
    createPosSale: CreatePosSaleUseCase,
    overrides?: { amountCents?: number },
  ) {
    const amount = overrides?.amountCents ?? 1000;
    return createPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      operatorId: USER_ID,
      customerName: 'Cliente',
      lines: [
        {
          productId: PRODUCT_ID,
          quantity: '1',
          unitPriceCents: amount,
        },
      ],
      payments: [{ methodId: METHOD_ID, amountCents: amount }],
    });
  }

  it('cancela venda pdv e soft-delete dos recebíveis', async () => {
    const { createPosSale, cancelPosSale, softDelete } = await setup({
      cancellationRequiresSupervisor: false,
      financialEntryIds: [FE_ID],
    });
    const sale = await createSale(createPosSale);

    const cancelled = await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });

    expect(cancelled.status).toBe('cancelled');
    expect(softDelete).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      FE_ID,
      expect.any(Date),
    );
  });

  it('estorna estoque quando havia saída', async () => {
    const { createPosSale, cancelPosSale, stockMovementRepository } =
      await setup({
        trackStock: true,
        cancellationRequiresSupervisor: false,
      });
    const sale = await createSale(createPosSale);
    expect(sale.stockMovementId).toBeTruthy();
    const before = stockMovementRepository.movements.size;

    await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });

    expect(stockMovementRepository.movements.size).toBe(before + 1);
    const reversal = [...stockMovementRepository.movements.values()].find(
      (m) => m.type === 'entrada' && m.sourceId === sale.id,
    );
    expect(reversal).toBeDefined();
  });

  it('é idempotente se já cancelada', async () => {
    const { createPosSale, cancelPosSale } = await setup({
      cancellationRequiresSupervisor: false,
    });
    const sale = await createSale(createPosSale);
    await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });

    const again = await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });
    expect(again.status).toBe('cancelled');
  });

  it('exige permissão venda.cancel', async () => {
    const { createPosSale, cancelPosSale } = await setup({
      cancelPermission: false,
      cancellationRequiresSupervisor: false,
    });
    const sale = await createSale(createPosSale);

    await expect(
      cancelPosSale.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        saleId: sale.id,
        operatorId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(PosSaleCancelForbiddenError);
  });

  it('exige supervisor quando a política pede', async () => {
    const { createPosSale, cancelPosSale } = await setup();
    const sale = await createSale(createPosSale);

    await expect(
      cancelPosSale.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        saleId: sale.id,
        operatorId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(PosSaleSupervisorRequiredError);

    const cancelled = await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
      authorizedByUserId: SUPERVISOR_USER,
    });
    expect(cancelled.status).toBe('cancelled');
  });

  it('bloqueia se recebível está conciliado', async () => {
    const { createPosSale, cancelPosSale, bankStatementMatchRepository } =
      await setup({
        cancellationRequiresSupervisor: false,
        financialEntryIds: [FE_ID],
      });
    await bankStatementMatchRepository.saveMany([
      BankStatementMatch.create(
        {
          organizationId: ORGANIZATION_ID,
          bankStatementTransactionId: 'tx-1',
          financialEntryId: FE_ID,
          financialEntryPaymentId: 'pay-1',
          amountCents: 1000,
        },
        'match-1',
      ),
    ]);
    const sale = await createSale(createPosSale);

    await expect(
      cancelPosSale.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        saleId: sale.id,
        operatorId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(PosSaleReceivablesInUseError);
  });

  it('exige turno aberto', async () => {
    const { createPosSale, cancelPosSale, cashSessionRepository } = await setup(
      {
        cancellationRequiresSupervisor: false,
      },
    );
    const sale = await createSale(createPosSale);
    cashSessionRepository.clear();

    await expect(
      cancelPosSale.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        posTerminalId: TERMINAL_ID,
        saleId: sale.id,
        operatorId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(PosSaleCashSessionRequiredError);
  });

  it('ao cancelar venda de delivery reabre o pedido se status legado era delivered', async () => {
    const {
      createPosSale,
      cancelPosSale,
      deliveryOrderRepository,
      prisma,
      deliveryUpdate,
      deliveryFindFirst,
    } = await setup({
      cancellationRequiresSupervisor: false,
    });
    const { PosDeliveryOrder } = await import(
      '../../../../pos-delivery/domain/entities/pos-delivery-order.entity'
    );
    const order = PosDeliveryOrder.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      number: 7,
      fulfillment: 'delivery',
      customerId: null,
      customerName: 'Cliente',
      addressZipCode: null,
      addressStreet: null,
      addressNumber: null,
      addressDistrict: null,
      addressCity: null,
      addressState: null,
      addressComplement: null,
      addressText: 'Rua A, 1',
      feeCents: 0,
      courierId: 'courier-1',
      courierName: 'Motoboy',
      posTerminalId: TERMINAL_ID,
      operatorUserId: USER_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          productName: 'Produto',
          quantity: '1',
          unitPriceCents: 1000,
          notes: '',
        },
      ],
    });
    await deliveryOrderRepository.save(order);
    const sale = await createPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      operatorId: USER_ID,
      customerName: 'Cliente',
      posDeliveryOrderId: order.id,
      lines: [
        {
          productId: PRODUCT_ID,
          quantity: '1',
          unitPriceCents: 1000,
        },
      ],
      payments: [{ methodId: METHOD_ID, amountCents: 1000 }],
    });

    (
      prisma.scoped.saleOrder.findFirst as jest.Mock
    ).mockResolvedValue({
      posTerminalId: TERMINAL_ID,
      posDeliveryOrderId: order.id,
    });
    deliveryFindFirst.mockResolvedValue({
      fulfillment: 'delivery',
      status: 'delivered',
    });

    await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });

    expect(deliveryUpdate).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { status: 'dispatched' },
    });
  });

  it('ao cancelar venda de delivery não altera status se não estava delivered', async () => {
    const {
      createPosSale,
      cancelPosSale,
      deliveryOrderRepository,
      prisma,
      deliveryUpdate,
      deliveryFindFirst,
    } = await setup({
      cancellationRequiresSupervisor: false,
    });
    const { PosDeliveryOrder } = await import(
      '../../../../pos-delivery/domain/entities/pos-delivery-order.entity'
    );
    const order = PosDeliveryOrder.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      number: 8,
      fulfillment: 'delivery',
      customerId: null,
      customerName: 'Cliente',
      addressZipCode: null,
      addressStreet: null,
      addressNumber: null,
      addressDistrict: null,
      addressCity: null,
      addressState: null,
      addressComplement: null,
      addressText: 'Rua A, 1',
      feeCents: 0,
      courierId: 'courier-1',
      courierName: 'Motoboy',
      posTerminalId: TERMINAL_ID,
      operatorUserId: USER_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          productName: 'Produto',
          quantity: '1',
          unitPriceCents: 1000,
          notes: '',
        },
      ],
    });
    await deliveryOrderRepository.save(order);
    const sale = await createPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      operatorId: USER_ID,
      customerName: 'Cliente',
      posDeliveryOrderId: order.id,
      lines: [
        {
          productId: PRODUCT_ID,
          quantity: '1',
          unitPriceCents: 1000,
        },
      ],
      payments: [{ methodId: METHOD_ID, amountCents: 1000 }],
    });

    (
      prisma.scoped.saleOrder.findFirst as jest.Mock
    ).mockResolvedValue({
      posTerminalId: TERMINAL_ID,
      posDeliveryOrderId: order.id,
    });
    deliveryFindFirst.mockResolvedValue({
      fulfillment: 'delivery',
      status: 'preparing',
    });

    await cancelPosSale.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      posTerminalId: TERMINAL_ID,
      saleId: sale.id,
      operatorId: USER_ID,
    });

    expect(deliveryUpdate).not.toHaveBeenCalled();
    expect(
      (await deliveryOrderRepository.findById(ORGANIZATION_ID, order.id))
        ?.status,
    ).toBe('received');
  });
});
