import { ProcessPaymentUpdatedUseCase } from './process-payment-updated.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('ProcessPaymentUpdatedUseCase', () => {
  let useCase: ProcessPaymentUpdatedUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new ProcessPaymentUpdatedUseCase(invoiceRepository);
  });

  it('should update invoice value and due date', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      amountCents: 10000,
      dueDate: new Date('2026-07-17T12:00:00-03:00'),
      periodStart: new Date('2026-07-17'),
      periodEnd: new Date('2026-08-17'),
      gatewayPaymentId: 'pay_123',
      method: 'PIX',
    });
    await invoiceRepository.save(invoice);

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
        value: 120,
        dueDate: '2026-07-20',
        billingType: 'BOLETO',
      },
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(invoice.id);
    expect(result?.amountCents).toBe(12000);
    const expectedDate = new Date('2026-07-20T12:00:00-03:00').toISOString();
    expect(result?.dueDate.toISOString()).toBe(expectedDate);
    expect(result?.method).toBe('BOLETO');
  });

  it('should return null if invoice not found', async () => {
    const result = await useCase.execute({
      payment: {
        id: 'pay_unknown',
        value: 120,
        dueDate: '2026-07-20',
        billingType: 'BOLETO',
      },
    });

    expect(result).toBeNull();
  });
});
