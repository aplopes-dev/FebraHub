import { CreateManualInvoiceUseCase } from './create-manual-invoice.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryStoreRepository } from '../../../../stores/tests/in-memory-store.repository';
import { FakePaymentGateway } from '../../../../payment-gateway/tests/fake-payment-gateway';
import { Store } from '../../../../stores/domain/entities/store.entity';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { StoreNotFoundError } from '../../../../stores/domain/errors/store-not-found.error';
import { SubscriptionNotFoundError } from '../../../../subscriptions/domain/errors/subscription-not-found.error';

function buildStore(overrides: { gatewayCustomerId?: string } = {}): Store {
  return Store.create({
    vertical: 'Comércio',
    tradeName: 'Maria Doces',
    slug: `maria-doces-${crypto.randomUUID()}`,
    document: '11222333000181',
    personType: 'PJ',
    responsibleName: 'Owner',
    billingEmail: 'store@test.com',
    timezone: 'America/Sao_Paulo',
    gatewayCustomerId: overrides.gatewayCustomerId ?? null,
  });
}

describe('CreateManualInvoiceUseCase', () => {
  let useCase: CreateManualInvoiceUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;
  let storeRepository: InMemoryStoreRepository;
  let paymentGateway: FakePaymentGateway;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    storeRepository = new InMemoryStoreRepository();
    paymentGateway = new FakePaymentGateway();
    useCase = new CreateManualInvoiceUseCase(
      invoiceRepository,
      subscriptionRepository,
      storeRepository,
      paymentGateway,
    );
  });

  it('should create a manual invoice successfully', async () => {
    const store = await storeRepository.save(buildStore());

    const subscription = Subscription.create({
      storeId: store.id,
      planPriceId: '9dccd404-e635-450f-8227-ac630403605e',
      cycle: 'MONTHLY',
      dayOfMonth: 10,
      currentPeriodStart: new Date('2026-07-01'),
      currentPeriodEnd: new Date('2026-07-31'),
    });
    await subscriptionRepository.save(subscription);

    const dto = {
      storeId: store.id,
      subscriptionId: subscription.id,
      amountCents: 15000,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      notes: 'Test notes',
    };

    const result = await useCase.execute(dto);

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(store.id);
    expect(result.subscriptionId).toBe(subscription.id);
    expect(result.amountCents).toBe(15000);
    expect(result.notes).toBe('Test notes');
    expect(result.status).toBe('OPEN');
    expect(result.periodStart.getFullYear()).toBe(2026);
    expect(result.periodStart.getMonth()).toBe(6); // Julho é 6
    expect(result.periodStart.getDate()).toBe(1);
    expect(result.periodStart.getHours()).toBe(0);

    expect(result.periodEnd.getFullYear()).toBe(2026);
    expect(result.periodEnd.getMonth()).toBe(6); // Julho é 6
    expect(result.periodEnd.getDate()).toBe(31);
    expect(result.periodEnd.getHours()).toBe(23);

    // O vencimento deve ser gerado para o próximo mês (agosto, já que a referência é a data atual que é julho de 2026 ou o momento atual).
    // O vencimento deve ser no dia de vencimento (dayOfMonth = 10) do próximo mês.
    const expectedDueDateMonth = new Date().getMonth() + 1;
    const expectedDueDateYear =
      new Date().getFullYear() + Math.floor(expectedDueDateMonth / 12);
    const normalizedMonth = expectedDueDateMonth % 12;

    expect(result.dueDate.getDate()).toBe(10);
    expect(result.dueDate.getMonth()).toBe(normalizedMonth);
    expect(result.dueDate.getFullYear()).toBe(expectedDueDateYear);

    const saved = await invoiceRepository.findById(result.id);
    expect(saved).toBeDefined();
    expect(saved?.amountCents).toBe(15000);
  });

  it('should throw StoreNotFoundError if store does not exist', async () => {
    const dto = {
      storeId: '00000000-0000-4000-8000-000000000001',
      amountCents: 15000,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(StoreNotFoundError);
  });

  it('should throw SubscriptionNotFoundError if subscription does not exist', async () => {
    const store = await storeRepository.save(buildStore());

    const dto = {
      storeId: store.id,
      subscriptionId: 'non-existing-subscription',
      amountCents: 15000,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    };

    await expect(useCase.execute(dto)).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });

  it('should create gateway invoice when the store has a gatewayCustomerId', async () => {
    // `gatewayCustomerId` migrou de `Client` para `Store` na Fase 10.
    const store = await storeRepository.save(
      buildStore({ gatewayCustomerId: 'cus_abc123' }),
    );

    const subscription = Subscription.create({
      storeId: store.id,
      planPriceId: '9dccd404-e635-450f-8227-ac630403605e',
      cycle: 'MONTHLY',
      dayOfMonth: 10,
      currentPeriodStart: new Date('2026-07-01'),
      currentPeriodEnd: new Date('2026-07-31'),
    });
    await subscriptionRepository.save(subscription);

    const dto = {
      storeId: store.id,
      subscriptionId: subscription.id,
      amountCents: 15000,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    };

    const result = await useCase.execute(dto);

    expect(result.gatewayPaymentId).toBeDefined();
    expect(result.gatewayPaymentId).toMatch(/^pay_/);
    expect(paymentGateway.invoices).toHaveLength(1);
    expect(paymentGateway.invoices[0].gatewayCustomerId).toBe('cus_abc123');
    expect(paymentGateway.invoices[0].value).toBe(150);
  });
});
