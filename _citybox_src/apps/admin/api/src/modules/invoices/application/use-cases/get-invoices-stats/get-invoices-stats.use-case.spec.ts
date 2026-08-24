import { GetInvoicesStatsUseCase } from './get-invoices-stats.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('GetInvoicesStatsUseCase', () => {
  let useCase: GetInvoicesStatsUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new GetInvoicesStatsUseCase(invoiceRepository);
  });

  it('should calculate invoices statistics correctly', async () => {
    const store1 = '11111111-1111-4111-a111-111111111111';
    const sub1 = '33333333-3333-4333-8333-333333333333';

    const inv1 = Invoice.create({
      subscriptionId: sub1,
      storeId: store1,
      amountCents: 1000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
    });
    inv1.props.clientName = 'Maria Silva';

    const inv2 = Invoice.create({
      subscriptionId: sub1,
      storeId: store1,
      amountCents: 2000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'PAID',
      method: 'PIX',
    });
    inv2.props.clientName = 'Maria Silva';

    const inv3 = Invoice.create({
      subscriptionId: sub1,
      storeId: store1,
      amountCents: 3000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'PAST_DUE',
    });
    inv3.props.clientName = 'Maria Silva';

    await invoiceRepository.save(inv1);
    await invoiceRepository.save(inv2);
    await invoiceRepository.save(inv3);

    const stats = await useCase.execute({});
    expect(stats.openTotalCents).toBe(4000); // 1000 (OPEN) + 3000 (PAST_DUE)
    expect(stats.paidTotalCents).toBe(2000); // 2000 (PAID)
    expect(stats.pendingCount).toBe(1);
    expect(stats.overdueCount).toBe(1);
    expect(stats.paidCount).toBe(1);
    expect(stats.totalCount).toBe(3);
    expect(stats.delinquencyRate).toBe(33); // 1 / 3 = 33%

    const filteredByMethod = await useCase.execute({ method: ['PIX'] });
    expect(filteredByMethod.totalCount).toBe(1);
    expect(filteredByMethod.paidTotalCents).toBe(2000);

    const filteredBySearch = await useCase.execute({ search: 'Maria' });
    expect(filteredBySearch.totalCount).toBe(3);

    const filteredByStatus = await useCase.execute({ status: ['PAID'] });
    expect(filteredByStatus.totalCount).toBe(1);
    expect(filteredByStatus.paidCount).toBe(1);
  });
});
