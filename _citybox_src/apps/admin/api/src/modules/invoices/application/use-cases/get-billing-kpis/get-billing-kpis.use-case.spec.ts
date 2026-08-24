import { GetBillingKpisUseCase } from './get-billing-kpis.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('GetBillingKpisUseCase', () => {
  let useCase: GetBillingKpisUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;
  let subscriptionRepository: InMemorySubscriptionRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    subscriptionRepository = new InMemorySubscriptionRepository();
    useCase = new GetBillingKpisUseCase(
      invoiceRepository,
      subscriptionRepository,
    );
  });

  it('should calculate financial KPIs correctly based on data', async () => {
    const store1 = '11111111-1111-4111-a111-111111111111';
    const store2 = '22222222-2222-4222-b222-222222222222';
    const store3 = '33333333-3333-4333-8333-333333333333';

    // Arrange: Create some active and canceled subscriptions
    const subMonthly = Subscription.create({
      storeId: store1,
      planPriceId: '11111111-1111-4111-a111-111111111111', // price: 9900 cents
      cycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      dayOfMonth: 5,
    });
    const subYearly = Subscription.create({
      storeId: store2,
      planPriceId: '11111111-1111-4111-a111-222222222222', // price: 99000 cents
      cycle: 'YEARLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      dayOfMonth: 10,
    });
    const subCanceled = Subscription.create({
      storeId: store3,
      planPriceId: '22222222-2222-4222-b222-111111111111', // price: 14900 cents
      cycle: 'MONTHLY',
      status: 'CANCELED',
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(),
      dayOfMonth: 15,
      canceledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // in the last 30 days
    });

    await subscriptionRepository.save(subMonthly);
    await subscriptionRepository.save(subYearly);
    await subscriptionRepository.save(subCanceled);

    // Create some invoices
    // Past due invoice
    const invPastDue = Invoice.create({
      subscriptionId: subMonthly.id,
      storeId: subMonthly.storeId,
      amountCents: 5000,
      status: 'PAST_DUE',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      periodStart: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Open invoice due within 30 days
    const invOpenSoon = Invoice.create({
      subscriptionId: subMonthly.id,
      storeId: subMonthly.storeId,
      amountCents: 9900,
      status: 'OPEN',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Open invoice due after 30 days
    const invOpenLater = Invoice.create({
      subscriptionId: subMonthly.id,
      storeId: subMonthly.storeId,
      amountCents: 9900,
      status: 'OPEN',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      periodStart: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
    });

    // Paid invoice
    const invPaid = Invoice.create({
      subscriptionId: subMonthly.id,
      storeId: subMonthly.storeId,
      amountCents: 9900,
      status: 'PAID',
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
      method: 'PIX',
      periodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    await invoiceRepository.save(invPastDue);
    await invoiceRepository.save(invOpenSoon);
    await invoiceRepository.save(invOpenLater);
    await invoiceRepository.save(invPaid);

    // Act
    const kpis = await useCase.execute({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    });

    // Assert
    // Expected MRR: subMonthly (9900) + subYearly (99000 / 12 = 8250) = 18150 cents
    expect(kpis.mrrCents).toBe(18150);

    // Expected MRR Churned: subCanceled (14900) = 14900 cents
    expect(kpis.mrrChurnedCents).toBe(14900);

    // Expected Past Due: invPastDue (5000) = 5000 cents
    expect(kpis.pastDueAmountCents).toBe(5000);

    // Expected Total Faturado: invPastDue (5000) + invOpenSoon (9900) + invOpenLater (9900) + invPaid (9900) = 34700 cents
    // Rate: 5000 / 34700 = ~0.144
    expect(kpis.inadimplenciaRate).toBeCloseTo(5000 / 34700, 4);

    // Expected open within period: invOpenSoon (9900) + invOpenLater (9900) = 19800 cents
    expect(kpis.openAmountNext30DaysCents).toBe(19800);

    // Expected current month expected receipts: invPastDue (5000) + invOpenSoon (9900) + invOpenLater (9900) + invPaid (9900) = 34700 cents
    expect(kpis.currentMonthExpectedReceiptsCents).toBe(34700);

    // Expected current month received receipts: invPaid (9900) = 9900 cents
    expect(kpis.currentMonthReceivedReceiptsCents).toBe(9900);

    // Expected current month total invoices: 4
    expect(kpis.currentMonthTotalInvoicesCount).toBe(4);

    // Expected current month on-time invoices: 2 (invOpenSoon and invOpenLater are within deadline, invPaid was paid late, invPastDue is past due)
    expect(kpis.currentMonthOnTimeInvoicesCount).toBe(2);

    // Verify new aggregations
    expect(kpis.topDefaulters).toHaveLength(1);
    // `TopDefaulter.clientId` carrega o id da LOJA desde a Fase 10 — o ranking agrupa
    // por `storeId`, não mais por cliente.
    expect(kpis.topDefaulters[0].clientId).toBe(store1);
    expect(kpis.topDefaulters[0].amountCents).toBe(5000);
    expect(kpis.revenueHistory.length).toBeGreaterThan(0);
  });
});
