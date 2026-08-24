import { GetInvoicePaymentDetailsUseCase } from './get-invoice-payment-details.use-case';
import { InMemoryInvoiceRepository } from '../../../tests/in-memory-invoice.repository';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';
import { InvoiceNotPublishedError } from '../../../domain/errors/invoice-not-published.error';
import { PaymentGateway } from '../../../../payment-gateway/domain/providers/payment-gateway.interface';
import { GatewayInvoice } from '../../../../payment-gateway/domain/entities/gateway-invoice.entity';
import { InvoiceStatus } from '../../../../payment-gateway/domain/enums/invoice-status.enum';
import { PaymentMethod } from '../../../../payment-gateway/domain/enums/payment-method.enum';

describe('GetInvoicePaymentDetailsUseCase', () => {
  let useCase: GetInvoicePaymentDetailsUseCase;
  let invoiceRepository: InMemoryInvoiceRepository;
  let paymentGatewayMock: jest.Mocked<PaymentGateway>;

  beforeEach(() => {
    invoiceRepository = new InMemoryInvoiceRepository();
    paymentGatewayMock = {
      getInvoice: jest.fn(),
    } as any;

    useCase = new GetInvoicePaymentDetailsUseCase(
      invoiceRepository,
      paymentGatewayMock,
    );
  });

  it('should return gateway invoice details when invoice exists and has gatewayId', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'd7aa9c46-8b5c-49d8-a633-d65387457fb5',
      storeId: 'c1d9a0d8-1111-4a44-8888-888888888888',
      amountCents: 15000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: 'pay_123',
    });
    await invoiceRepository.save(invoice);

    const gatewayInvoiceMock = GatewayInvoice.create({
      gatewayPaymentId: 'pay_123',
      gatewayCustomerId: 'cus_123',
      value: 150.0,
      status: InvoiceStatus.PENDING,
      billingType: PaymentMethod.BOLETO,
      dueDate: new Date(),
      bankSlipUrl: 'http://boleto.url',
      bankSlipBarCode: '34191.79001...',
    });
    paymentGatewayMock.getInvoice.mockResolvedValue(gatewayInvoiceMock);

    const result = await useCase.execute(invoice.id);

    expect(paymentGatewayMock.getInvoice).toHaveBeenCalledWith('pay_123');
    expect(result.bankSlipUrl).toBe('http://boleto.url');
    expect(result.bankSlipBarCode).toBe('34191.79001...');
  });

  it('should throw InvoiceNotFoundError when local invoice is not found', async () => {
    await expect(useCase.execute('invalid-id')).rejects.toBeInstanceOf(
      InvoiceNotFoundError,
    );
  });

  it('should throw InvoiceNotPublishedError when local invoice lacks a gatewayPaymentId', async () => {
    const invoice = Invoice.create({
      subscriptionId: 'd7aa9c46-8b5c-49d8-a633-d65387457fb5',
      storeId: 'c1d9a0d8-1111-4a44-8888-888888888888',
      amountCents: 15000,
      dueDate: new Date(),
      periodStart: new Date(),
      periodEnd: new Date(),
      gatewayPaymentId: null,
    });
    await invoiceRepository.save(invoice);

    await expect(useCase.execute(invoice.id)).rejects.toBeInstanceOf(
      InvoiceNotPublishedError,
    );
  });
});
