import { ProcessPaymentOverdueUseCase } from './process-payment-overdue.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('ProcessPaymentOverdueUseCase', () => {
  let useCase: ProcessPaymentOverdueUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new ProcessPaymentOverdueUseCase(invoiceRepository);
  });

  it('should mark open invoice as past due', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      amountCents: 10000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: 'pay_123',
      status: 'OPEN',
    });
    await invoiceRepository.save(invoice);

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
      },
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(invoice.id);
    expect(result?.status).toBe('PAST_DUE');
  });

  it('should skip if invoice is already past due', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      amountCents: 10000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: 'pay_123',
      status: 'PAST_DUE',
    });
    await invoiceRepository.save(invoice);

    const spySave = jest.spyOn(invoiceRepository, 'save');

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
      },
    });

    expect(result?.status).toBe('PAST_DUE');
    expect(spySave).not.toHaveBeenCalled();
  });
});
