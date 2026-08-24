import { ProcessPaymentPaidUseCase } from './process-payment-paid.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';

describe('ProcessPaymentPaidUseCase', () => {
  let useCase: ProcessPaymentPaidUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    useCase = new ProcessPaymentPaidUseCase(invoiceRepository);
  });

  it('should mark open invoice as paid', async () => {
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
        billingType: 'CREDIT_CARD',
      },
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(invoice.id);
    expect(result?.status).toBe('PAID');
    expect(result?.paidAt).toBeInstanceOf(Date);
    expect(result?.method).toBe('CREDIT_CARD');
  });

  it('should skip if invoice is already paid', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      amountCents: 10000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: 'pay_123',
      status: 'PAID',
      paidAt: new Date(),
      method: 'PIX',
    });
    await invoiceRepository.save(invoice);

    const spySave = jest.spyOn(invoiceRepository, 'save');

    const result = await useCase.execute({
      payment: {
        id: 'pay_123',
        billingType: 'BOLETO',
      },
    });

    expect(result?.status).toBe('PAID');
    expect(spySave).not.toHaveBeenCalled();
  });
});
