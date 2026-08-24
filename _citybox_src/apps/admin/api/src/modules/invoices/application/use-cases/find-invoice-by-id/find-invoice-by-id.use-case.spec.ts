import { FindInvoiceByIdUseCase } from './find-invoice-by-id.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';

describe('FindInvoiceByIdUseCase', () => {
  let useCase: FindInvoiceByIdUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new FindInvoiceByIdUseCase(invoiceRepository);
  });

  it('should find an invoice by id', async () => {
    const invoice = Invoice.create({
      subscriptionId: '11111111-1111-4111-a111-111111111111',
      storeId: '22222222-2222-4222-b222-222222222222',
      amountCents: 1000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
    });
    await invoiceRepository.save(invoice);

    const result = await useCase.execute(invoice.id);
    expect(result.id).toBe(invoice.id);
  });

  it('should throw InvoiceNotFoundError if invoice does not exist', async () => {
    await expect(
      useCase.execute('e5b7b9f8-d456-4b53-a55e-141a27ee2107'),
    ).rejects.toThrow(InvoiceNotFoundError);
  });

  it('should lazily update status to PAST_DUE if invoice is open and past due date', async () => {
    const invoice = Invoice.create({
      subscriptionId: '11111111-1111-4111-a111-111111111111',
      storeId: '22222222-2222-4222-b222-222222222222',
      amountCents: 1000,
      dueDate: new Date(Date.now() - 1000), // in the past
      periodStart: new Date(),
      periodEnd: new Date(),
      status: 'OPEN',
    });
    await invoiceRepository.save(invoice);

    const result = await useCase.execute(invoice.id);
    expect(result.status).toBe('PAST_DUE');

    const persisted = await invoiceRepository.findById(invoice.id);
    expect(persisted?.status).toBe('PAST_DUE');
  });
});
