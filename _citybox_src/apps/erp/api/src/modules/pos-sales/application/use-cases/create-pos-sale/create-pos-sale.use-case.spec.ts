import { CreatePosSaleUseCase } from './create-pos-sale.use-case';
import { PosSaleOperatorInvalidError } from '../../../domain/errors/pos-sale-operator-invalid.error';
import { PosSalePaymentsInsufficientError } from '../../../domain/errors/pos-sale-payments-insufficient.error';
import { PosSaleCashSessionRequiredError } from '../../../domain/errors/pos-sale-cash-session-required.error';
import { PosSaleSupervisorRequiredError } from '../../../domain/errors/pos-sale-supervisor-required.error';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { InMemoryPosPolicyRepository } from '../../../../pos-policies/tests/in-memory-pos-policy.repository';
import { PosPolicy } from '../../../../pos-policies/domain/entities/pos-policy.entity';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import {
  makeRepositories as makeTenancyRepositories,
  MEMBERSHIP_ID,
  USER_ID,
  makeMembership,
  makeUser,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { PosCashSession } from '../../../../pos-cash-sessions/domain/entities/pos-cash-session.entity';
import { InMemoryPosCashSessionRepository } from '../../../../pos-cash-sessions/tests/in-memory-pos-cash-session.repository';
import { CreateSaleOrderUseCase } from '../../../../sales/application/use-cases/create-sale-order/create-sale-order.use-case';
import { InMemorySaleOrderRepository } from '../../../../sales/tests/in-memory-sale-order.repository';
import { InMemoryCustomerRepository } from '../../../../customers/tests/in-memory-customer.repository';
import { PaymentMethod } from '../../../../finance/payment-methods/domain/entities/payment-method.entity';
import { InMemoryPaymentMethodRepository } from '../../../../finance/payment-methods/tests/in-memory-payment-method.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { InMemoryStockRepository } from '../../../../stock/tests/in-memory-stock.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../../stock/tests/in-memory-stock-movement.repository';
import { makeStock } from '../../../../stock/tests/stocks-test-factory';
import { InMemoryPosDeliveryOrderRepository } from '../../../../pos-delivery/tests/in-memory-pos-delivery-order.repository';
import { PosDeliveryOrder } from '../../../../pos-delivery/domain/entities/pos-delivery-order.entity';
import { AlreadySoldError } from '../../../../pos-delivery/domain/errors/pos-delivery.errors';

const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const METHOD_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PROFILE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TERMINAL_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const SESSION_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const SUPERVISOR_USER_ID = '99999999-9999-4999-8999-999999999999';
const SUPERVISOR_MEMBERSHIP_ID = '88888888-8888-4888-8888-888888888888';
const SUPERVISOR_PROFILE_ID = '77777777-7777-4777-8777-777777777777';

describe('CreatePosSaleUseCase', () => {
  async function setup(options?: {
    withOpenSession?: boolean;
    discountLimitPercent?: number;
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
    const policyRepository = new InMemoryPosPolicyRepository();
    const getPosPolicy = new GetPosPolicyUseCase(policyRepository);
    const tenancy = makeTenancyRepositories();

    const createSaleOrder = new CreateSaleOrderUseCase(
      saleOrderRepository,
      customerRepository,
      stockRepository,
      stockProductLookup,
    );

    const prisma = {
      scoped: {
        saleOrder: {
          findFirst: jest.fn(
            async (args: {
              where: { posDeliveryOrderId?: string; status?: unknown };
            }) => {
              const deliveryId = args.where.posDeliveryOrderId;
              if (!deliveryId) return null;
              const saleId =
                deliveryOrderRepository.activeSaleByDeliveryId.get(deliveryId);
              return saleId ? { id: saleId } : null;
            },
          ),
        },
      },
    };

    const useCase = new CreatePosSaleUseCase(
      createSaleOrder,
      paymentMethodRepository,
      stockRepository,
      tenancy.membershipRepository,
      cashSessionRepository,
      deliveryOrderRepository,
      getPosPolicy,
      prisma as never,
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
      trackStock: false,
      deletedAt: null,
    });
    await tenancy.seedOwner();

    tenancy.membershipRepository.registerPermissionProfile({
      id: PROFILE_ID,
      name: 'Caixa',
      systemKey: 'caixa',
      permissionIds: ['pdv.operacao.venda.create'],
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
      id: SUPERVISOR_PROFILE_ID,
      name: 'Gerente',
      systemKey: 'gerente',
      permissionIds: [
        'pdv.operacao.venda.create',
        'pdv.operacao.alcada.authorize',
      ],
    });
    await tenancy.userRepository.save(
      makeUser({ id: SUPERVISOR_USER_ID, name: 'Ana Gerente' }),
    );
    await tenancy.membershipRepository.save(
      makeMembership({
        id: SUPERVISOR_MEMBERSHIP_ID,
        userId: SUPERVISOR_USER_ID,
        permissionProfileId: SUPERVISOR_PROFILE_ID,
        pdvCode: '99',
        pdvPinHash: await PinHasher.hash('9999'),
      }),
    );
    await tenancy.membershipRepository.replaceBranchAccess(
      ORGANIZATION_ID,
      SUPERVISOR_MEMBERSHIP_ID,
      [BRANCH_ID],
    );

    await policyRepository.save(
      PosPolicy.with(
        {
          organizationId: ORGANIZATION_ID,
          discountSupervisorAbovePercent: options?.discountLimitPercent ?? 10,
          withdrawalSupervisorAboveCents: 50_000,
          cancellationRequiresSupervisor: true,
          refundRequiresSupervisor: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'policy-1',
      ),
    );

    if (options?.withOpenSession !== false) {
      await cashSessionRepository.save(
        PosCashSession.create(
          {
            organizationId: ORGANIZATION_ID,
            branchId: BRANCH_ID,
            posTerminalId: TERMINAL_ID,
            openedByUserId: USER_ID,
            openedByName: 'Maria Caixa',
            openingFloatCents: 10_000,
          },
          SESSION_ID,
        ),
      );
    }

    return {
      useCase,
      saleOrderRepository,
      cashSessionRepository,
      deliveryOrderRepository,
    };
  }

  const baseInput = {
    organizationId: ORGANIZATION_ID,
    branchId: BRANCH_ID,
    posTerminalId: TERMINAL_ID,
    operatorId: USER_ID,
    lines: [
      {
        productId: PRODUCT_ID,
        quantity: '1',
        unitPriceCents: 1000,
      },
    ],
    payments: [
      {
        methodId: METHOD_ID,
        amountCents: 1000,
      },
    ],
  };

  it('fecha a venda com o nome do membro no SaleOrder e vincula o turno', async () => {
    const { useCase, saleOrderRepository } = await setup();

    const sale = await useCase.execute(baseInput);

    expect(sale.status).toBe('closed');
    expect(sale.channelId).toBe('pdv');
    expect(sale.createdByName).toBe('Maria Caixa');
    expect(saleOrderRepository.posMetaBySaleId.get(sale.id)).toEqual({
      cashSessionId: SESSION_ID,
      posTerminalId: TERMINAL_ID,
      operatorUserId: USER_ID,
    });
  });

  it('fecha pedido de delivery usando sua taxa e vincula os dois registros', async () => {
    const { useCase, deliveryOrderRepository, saleOrderRepository } =
      await setup();
    const order = PosDeliveryOrder.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      number: 1,
      fulfillment: 'pickup',
      customerId: null,
      customerName: 'Cliente',
      addressZipCode: null,
      addressStreet: null,
      addressNumber: null,
      addressDistrict: null,
      addressCity: null,
      addressState: null,
      addressComplement: null,
      addressText: '',
      feeCents: 500,
      courierId: null,
      courierName: null,
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

    const sale = await useCase.execute({
      ...baseInput,
      posDeliveryOrderId: order.id,
      payments: [{ methodId: METHOD_ID, amountCents: 1500 }],
    });

    expect(sale.channelId).toBe('delivery');
    expect(sale.deliveryFeeCents).toBe(500);
    expect(saleOrderRepository.posMetaBySaleId.get(sale.id)).toEqual({
      cashSessionId: SESSION_ID,
      posTerminalId: TERMINAL_ID,
      operatorUserId: USER_ID,
      posDeliveryOrderId: order.id,
    });
    const linked = await deliveryOrderRepository.findById(
      ORGANIZATION_ID,
      order.id,
    );
    expect(linked?.status).toBe('received');
    expect(
      deliveryOrderRepository.activeSaleByDeliveryId.get(order.id),
    ).toBe(sale.id);
  });

  it('recusa segundo checkout enquanto houver venda ativa no delivery', async () => {
    const { useCase, deliveryOrderRepository } = await setup();
    const order = PosDeliveryOrder.create({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      number: 1,
      fulfillment: 'pickup',
      customerId: null,
      customerName: 'Cliente',
      addressZipCode: null,
      addressStreet: null,
      addressNumber: null,
      addressDistrict: null,
      addressCity: null,
      addressState: null,
      addressComplement: null,
      addressText: '',
      feeCents: 0,
      courierId: null,
      courierName: null,
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

    await useCase.execute({
      ...baseInput,
      posDeliveryOrderId: order.id,
      payments: [{ methodId: METHOD_ID, amountCents: 1000 }],
    });

    await expect(
      useCase.execute({
        ...baseInput,
        posDeliveryOrderId: order.id,
        payments: [{ methodId: METHOD_ID, amountCents: 1000 }],
      }),
    ).rejects.toBeInstanceOf(AlreadySoldError);
  });

  it('recusa venda sem caixa aberto no terminal', async () => {
    const { useCase } = await setup({ withOpenSession: false });

    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
      PosSaleCashSessionRequiredError,
    );
  });

  it('recusa operador (userId) sem credencial PDV elegível', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        operatorId: '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toBeInstanceOf(PosSaleOperatorInvalidError);
  });

  it('recusa pagamento insuficiente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        payments: [{ methodId: METHOD_ID, amountCents: 1 }],
      }),
    ).rejects.toBeInstanceOf(PosSalePaymentsInsufficientError);
  });

  it('aceita desconto dentro da alçada sem supervisor', async () => {
    const { useCase } = await setup();

    const sale = await useCase.execute({
      ...baseInput,
      discountsCents: 100, // 10% de 1000 — limite exclusivo: passa
      payments: [{ methodId: METHOD_ID, amountCents: 900 }],
    });

    expect(sale.status).toBe('closed');
    expect(sale.discountsCents).toBe(100);
  });

  it('recusa desconto acima da alçada sem supervisor', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseInput,
        discountsCents: 101, // > 10%
        payments: [{ methodId: METHOD_ID, amountCents: 899 }],
      }),
    ).rejects.toBeInstanceOf(PosSaleSupervisorRequiredError);
  });

  it('aceita desconto acima da alçada com supervisor', async () => {
    const { useCase } = await setup();

    const sale = await useCase.execute({
      ...baseInput,
      discountsCents: 200,
      discountAuthorizedByUserId: SUPERVISOR_USER_ID,
      payments: [{ methodId: METHOD_ID, amountCents: 800 }],
    });

    expect(sale.status).toBe('closed');
    expect(sale.discountsCents).toBe(200);
  });
});
