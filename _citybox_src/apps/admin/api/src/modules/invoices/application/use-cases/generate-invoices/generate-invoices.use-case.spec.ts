import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { GenerateInvoicesUseCase } from './generate-invoices.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { Invoice } from '../../../domain/entities/invoice.entity';
import type { BlockStoreUseCase } from '../../../../stores/application/use-cases/block-store/block-store.use-case';

describe('GenerateInvoicesUseCase', () => {
  let useCase: GenerateInvoicesUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    useCase = new GenerateInvoicesUseCase(
      invoiceRepository,
      subscriptionRepository,
      createPassThroughUnitOfWork(),
    );
  });

  it('should generate invoices for active subscriptions', async () => {
    // Arrange: Create active subscription
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const storeId = '22222222-2222-4222-b222-222222222222';

    const subscription = Subscription.create({
      storeId,
      planPriceId: '11111111-1111-4111-a111-111111111111', // exists in price mocks (9900 cents)
      cycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      dayOfMonth: 5,
    });
    await subscriptionRepository.save(subscription);

    // Act
    const result = await useCase.execute();

    // Assert
    expect(result.generatedCount).toBe(1);
    expect(result.skippedCount).toBe(0);

    const invoices = await invoiceRepository.findAll();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].subscriptionId).toBe(subscription.id);
    expect(invoices[0].storeId).toBe(storeId);
    expect(invoices[0].amountCents).toBe(9900);
    expect(invoices[0].status).toBe('OPEN');
    expect(invoices[0].periodStart.getTime()).toBe(
      currentPeriodStart.getTime(),
    );
    expect(invoices[0].periodEnd.getTime()).toBe(currentPeriodEnd.getTime());
  });

  it('should skip generating invoice if one already exists for the current period (idempotency)', async () => {
    // Arrange
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const storeId = '22222222-2222-4222-b222-222222222222';

    const subscription = Subscription.create({
      storeId,
      planPriceId: '11111111-1111-4111-a111-111111111111',
      cycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      dayOfMonth: 5,
    });
    await subscriptionRepository.save(subscription);

    // Act - Run 1
    const result1 = await useCase.execute();
    expect(result1.generatedCount).toBe(1);

    // Act - Run 2 (simulate running again immediately)
    const result2 = await useCase.execute();
    expect(result2.generatedCount).toBe(0);
    expect(result2.skippedCount).toBe(1);

    const invoices = await invoiceRepository.findAll();
    expect(invoices).toHaveLength(1);
  });

  it('suspends the store when an open invoice becomes past due', async () => {
    const storeId = '33333333-3333-4333-9333-333333333333';
    const overdueInvoice = Invoice.create({
      subscriptionId: '44444444-4444-4444-8444-444444444444',
      storeId,
      amountCents: 9900,
      status: 'OPEN',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
    });
    await invoiceRepository.save(overdueInvoice);

    const blockStoreExecute = jest.fn();
    const blockStore = {
      execute: blockStoreExecute,
    } as unknown as BlockStoreUseCase;
    const useCaseWithBlocking = new GenerateInvoicesUseCase(
      invoiceRepository,
      subscriptionRepository,
      createPassThroughUnitOfWork(),
      blockStore,
    );

    await useCaseWithBlocking.execute();

    expect(blockStoreExecute).toHaveBeenCalledWith({
      id: storeId,
      actor: 'system:billing',
    });

    const saved = await invoiceRepository.findById(overdueInvoice.id);
    expect(saved?.status).toBe('PAST_DUE');
  });

  it('does not block a store when the open invoice is not yet due', async () => {
    const storeId = '55555555-5555-4555-9555-555555555555';
    const invoice = Invoice.create({
      subscriptionId: '66666666-6666-4666-8666-666666666666',
      storeId,
      amountCents: 9900,
      status: 'OPEN',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await invoiceRepository.save(invoice);

    const blockStoreExecute = jest.fn();
    const blockStore = {
      execute: blockStoreExecute,
    } as unknown as BlockStoreUseCase;
    const useCaseWithBlocking = new GenerateInvoicesUseCase(
      invoiceRepository,
      subscriptionRepository,
      createPassThroughUnitOfWork(),
      blockStore,
    );

    await useCaseWithBlocking.execute();

    expect(blockStoreExecute).not.toHaveBeenCalled();
  });
});
