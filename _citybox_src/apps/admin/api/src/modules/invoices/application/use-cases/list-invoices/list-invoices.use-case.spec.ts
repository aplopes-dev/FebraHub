import { ListInvoicesUseCase } from './list-invoices.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('ListInvoicesUseCase', () => {
  let useCase: ListInvoicesUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new ListInvoicesUseCase(invoiceRepository);
  });

  it('should list invoices with pagination and filters', async () => {
    const store1 = '11111111-1111-4111-a111-111111111111';
    const store2 = '22222222-2222-4222-b222-222222222222';
    const sub1 = '33333333-3333-4333-8333-333333333333';
    const sub2 = '44444444-4444-4444-8444-444444444444';

    const inv1 = Invoice.create({
      subscriptionId: sub1,
      storeId: store1,
      amountCents: 1000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
      createdAt: new Date(Date.now() - 1000),
    });
    const inv2 = Invoice.create({
      subscriptionId: sub2,
      storeId: store2,
      amountCents: 2000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'PAID',
      createdAt: new Date(),
    });

    await invoiceRepository.save(inv1);
    await invoiceRepository.save(inv2);

    const result = await useCase.execute({ page: 1, perPage: 10 });
    expect(result.invoices).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);

    // O filtro é por LOJA desde a Fase 10 — a loja É o cliente do Citybox (PLAT-001).
    const filteredByStore = await useCase.execute({ storeId: store1 });
    expect(filteredByStore.invoices).toHaveLength(1);
    expect(filteredByStore.invoices[0].storeId).toBe(store1);

    const filteredByStatus = await useCase.execute({ status: ['PAID'] });
    expect(filteredByStatus.invoices).toHaveLength(1);
    expect(filteredByStatus.invoices[0].status).toBe('PAID');
  });
});
