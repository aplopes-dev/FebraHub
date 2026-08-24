import { ProcessPaymentCreatedUseCase } from './process-payment-created.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryStoreRepository } from '../../../../stores/tests/in-memory-store.repository';
import { Store } from '../../../../stores/domain/entities/store.entity';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { Invoice } from '../../../domain/entities/invoice.entity';

/**
 * O webhook só conhece o customer do PSP. Desde a Fase 10 o `gatewayCustomerId` mora na
 * Loja — é por ele que o caso de uso resolve a entidade local.
 */
function buildStoreWithGatewayCustomer(gatewayCustomerId: string): Store {
  return Store.create({
    vertical: 'Comércio',
    tradeName: 'Loja 1',
    slug: `loja-1-${crypto.randomUUID()}`,
    document: '52998224725',
    personType: 'PF',
    responsibleName: 'Resp 1',
    billingEmail: 'loja1@test.com',
    timezone: 'America/Sao_Paulo',
    gatewayCustomerId,
  });
}

describe('ProcessPaymentCreatedUseCase', () => {
  let useCase: ProcessPaymentCreatedUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;
  let storeRepository: InMemoryStoreRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    storeRepository = new InMemoryStoreRepository();

    useCase = new ProcessPaymentCreatedUseCase(
      invoiceRepository,
      subscriptionRepository,
      storeRepository,
    );
  });

  it('should skip if invoice already registered locally', async () => {
    const existingInvoice = Invoice.create({
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      amountCents: 10000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: 'pay_123',
    });
    await invoiceRepository.save(existingInvoice);

    const spySave = jest.spyOn(invoiceRepository, 'save');

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
        customer: 'cus_123',
        value: 100,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2026-07-17',
      },
    });

    expect(result?.id).toBe(existingInvoice.id);
    expect(spySave).not.toHaveBeenCalled();
  });

  it('should return null when no store matches the gateway customer', async () => {
    const result = await useCase.execute({
      payment: {
        id: 'pay_orphan',
        customer: 'cus_desconhecido',
        value: 100,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2026-07-17',
      },
    });

    expect(result).toBeNull();
  });

  it('should associate gatewayPaymentId to existing local matching draft/open invoice', async () => {
    const store = await storeRepository.save(
      buildStoreWithGatewayCustomer('cus_123'),
    );

    const subscription = Subscription.create({
      storeId: store.id,
      planPriceId: '11111111-1111-4111-a111-111111111111',
      cycle: 'MONTHLY',
      dayOfMonth: 17,
      currentPeriodStart: new Date('2026-07-17'),
      currentPeriodEnd: new Date('2026-08-17'),
      gatewaySubscriptionId: 'sub_123',
    });
    await subscriptionRepository.save(subscription);

    const localInvoice = Invoice.create({
      subscriptionId: subscription.id,
      storeId: store.id,
      amountCents: 10000,
      dueDate: new Date('2026-07-17T12:00:00-03:00'),
      periodStart: new Date('2026-07-17'),
      periodEnd: new Date('2026-08-17'),
      status: 'DRAFT',
    });
    await invoiceRepository.save(localInvoice);

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        value: 100,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2026-07-17',
      },
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(localInvoice.id);
    expect(result?.gatewayPaymentId).toBe('pay_123');
    expect(result?.status).toBe('OPEN'); // published
  });

  it('should create new open invoice if no matching local draft/open invoice exists', async () => {
    const store = await storeRepository.save(
      buildStoreWithGatewayCustomer('cus_123'),
    );

    const subscription = Subscription.create({
      storeId: store.id,
      planPriceId: '11111111-1111-4111-a111-111111111111',
      cycle: 'MONTHLY',
      dayOfMonth: 17,
      currentPeriodStart: new Date('2026-07-17'),
      currentPeriodEnd: new Date('2026-08-17'),
      gatewaySubscriptionId: 'sub_123',
    });
    await subscriptionRepository.save(subscription);

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        value: 100,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2026-07-17',
      },
    });

    expect(result).toBeDefined();
    expect(result?.gatewayPaymentId).toBe('pay_123');
    expect(result?.amountCents).toBe(10000);
    expect(result?.status).toBe('OPEN');
    expect(result?.storeId).toBe(store.id);
    expect(result?.subscriptionId).toBe(subscription.id);
  });
});
