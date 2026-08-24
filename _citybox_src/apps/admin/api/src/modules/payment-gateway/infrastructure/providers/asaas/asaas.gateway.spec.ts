import { AsaasGateway } from './asaas.gateway';
import { AsaasClient } from './asaas.client';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentCycle } from '../../../domain/enums/payment-cycle.enum';
import { InvalidWebhookSignatureError } from '../../../domain/errors/invalid-webhook-signature.error';

describe('AsaasGateway', () => {
  let gateway: AsaasGateway;
  let clientMock: jest.Mocked<AsaasClient>;

  beforeEach(() => {
    clientMock = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as any;

    gateway = new AsaasGateway(clientMock);
  });

  describe('createCustomer', () => {
    it('should call client.post and return GatewayCustomer entity', async () => {
      const responseMock = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
        cpfCnpj: '12345678901',
      };
      clientMock.post.mockResolvedValue(responseMock);

      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
      };

      const result = await gateway.createCustomer(input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/customers',
        expect.any(Object),
      );
      expect(result.gatewayCustomerId).toBe(responseMock.id);
      expect(result.name).toBe(responseMock.name);
    });
  });

  describe('updateCustomer', () => {
    it('should call client.post and return GatewayCustomer entity', async () => {
      const responseMock = {
        id: 'cus_123',
        name: 'John Updated',
        email: 'john@example.com',
        cpfCnpj: '12345678901',
      };
      clientMock.post.mockResolvedValue(responseMock);

      const input = {
        name: 'John Updated',
      };

      const result = await gateway.updateCustomer('cus_123', input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/customers/cus_123',
        expect.any(Object),
      );
      expect(result.gatewayCustomerId).toBe('cus_123');
      expect(result.name).toBe(responseMock.name);
    });
  });

  describe('createSubscription', () => {
    it('should call client.post and return GatewaySubscription entity', async () => {
      const responseMock = {
        id: 'sub_123',
        customer: 'cus_123',
        billingType: 'CREDIT_CARD',
        value: 99.9,
        cycle: 'MONTHLY',
        nextDueDate: '2026-08-15',
        status: 'ACTIVE',
      };
      clientMock.post.mockResolvedValue(responseMock);

      const input = {
        gatewayCustomerId: 'cus_123',
        value: 99.9,
        billingType: PaymentMethod.CREDIT_CARD,
        cycle: PaymentCycle.MONTHLY,
        nextDueDate: new Date('2026-08-15'),
      };

      const result = await gateway.createSubscription(input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/subscriptions',
        expect.any(Object),
      );
      expect(result.gatewaySubscriptionId).toBe(responseMock.id);
      expect(result.value).toBe(responseMock.value);
    });
  });

  describe('cancelSubscription', () => {
    it('should call client.delete', async () => {
      clientMock.delete.mockResolvedValue({});

      await gateway.cancelSubscription('sub_123');

      expect(clientMock.delete).toHaveBeenCalledWith('/subscriptions/sub_123');
    });
  });

  describe('createInvoice', () => {
    it('should create credit card invoice without fetching extra details', async () => {
      const responseMock = {
        id: 'pay_123',
        customer: 'cus_123',
        billingType: 'CREDIT_CARD',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };
      clientMock.post.mockResolvedValue(responseMock);

      const input = {
        gatewayCustomerId: 'cus_123',
        value: 150.0,
        billingType: PaymentMethod.CREDIT_CARD,
        dueDate: new Date('2026-07-20'),
      };

      const result = await gateway.createInvoice(input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/payments',
        expect.any(Object),
      );
      expect(clientMock.get).not.toHaveBeenCalled();
      expect(result.gatewayPaymentId).toBe(responseMock.id);
      expect(result.pixQrCode).toBeNull();
    });

    it('should create PIX invoice and fetch pixQrCode details', async () => {
      const responseMock = {
        id: 'pay_123',
        customer: 'cus_123',
        billingType: 'PIX',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };
      const pixQrMock = {
        encodedImage: 'base64_image_data',
        payload: 'pix_copia_e_cola',
        expirationDate: '2026-07-20T23:59:59',
      };
      clientMock.post.mockResolvedValue(responseMock);
      clientMock.get.mockResolvedValue(pixQrMock);

      const input = {
        gatewayCustomerId: 'cus_123',
        value: 150.0,
        billingType: PaymentMethod.PIX,
        dueDate: new Date('2026-07-20'),
      };

      const result = await gateway.createInvoice(input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/payments',
        expect.any(Object),
      );
      expect(clientMock.get).toHaveBeenCalledWith(
        '/payments/pay_123/pixQrCode',
      );
      expect(result.gatewayPaymentId).toBe(responseMock.id);
      expect(result.pixQrCode).toBe(pixQrMock.encodedImage);
      expect(result.pixCopyPaste).toBe(pixQrMock.payload);
    });

    it('should create BOLETO invoice and fetch identificationField details', async () => {
      const responseMock = {
        id: 'pay_123',
        customer: 'cus_123',
        billingType: 'BOLETO',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };
      const barCodeMock = {
        identificationField:
          '34191.79001 01043.513184 91020.150008 7 90000000015000',
        barCode: '3419790000000015000341917900101043513189102015000',
      };
      clientMock.post.mockResolvedValue(responseMock);
      clientMock.get.mockResolvedValue(barCodeMock);

      const input = {
        gatewayCustomerId: 'cus_123',
        value: 150.0,
        billingType: PaymentMethod.BOLETO,
        dueDate: new Date('2026-07-20'),
      };

      const result = await gateway.createInvoice(input);

      expect(clientMock.post).toHaveBeenCalledWith(
        '/payments',
        expect.any(Object),
      );
      expect(clientMock.get).toHaveBeenCalledWith(
        '/payments/pay_123/identificationField',
      );
      expect(result.gatewayPaymentId).toBe(responseMock.id);
      expect(result.bankSlipBarCode).toBe(barCodeMock.identificationField);
    });
  });

  describe('cancelInvoice', () => {
    it('should call client.delete', async () => {
      clientMock.delete.mockResolvedValue({});

      await gateway.cancelInvoice('pay_123');

      expect(clientMock.delete).toHaveBeenCalledWith('/payments/pay_123');
    });
  });

  describe('getInvoice', () => {
    it('should fetch PIX invoice and fetch pixQrCode details', async () => {
      const responseMock = {
        id: 'pay_123',
        customer: 'cus_123',
        billingType: 'PIX',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };
      const pixQrMock = {
        encodedImage: 'base64_image_data',
        payload: 'pix_copia_e_cola',
        expirationDate: '2026-07-20T23:59:59',
      };
      clientMock.get
        .mockResolvedValueOnce(responseMock) // Primeira chamada GET /payments/pay_123
        .mockResolvedValueOnce(pixQrMock); // Segunda chamada GET /payments/pay_123/pixQrCode

      const result = await gateway.getInvoice('pay_123');

      expect(clientMock.get).toHaveBeenNthCalledWith(1, '/payments/pay_123');
      expect(clientMock.get).toHaveBeenNthCalledWith(
        2,
        '/payments/pay_123/pixQrCode',
      );
      expect(result.gatewayPaymentId).toBe(responseMock.id);
      expect(result.pixQrCode).toBe(pixQrMock.encodedImage);
    });

    it('should fetch BOLETO invoice and fetch identificationField details', async () => {
      const responseMock = {
        id: 'pay_123',
        customer: 'cus_123',
        billingType: 'BOLETO',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };
      const barCodeMock = {
        identificationField:
          '34191.79001 01043.513184 91020.150008 7 90000000015000',
        barCode: '3419790000000015000341917900101043513189102015000',
      };
      clientMock.get
        .mockResolvedValueOnce(responseMock) // Primeira chamada GET /payments/pay_123
        .mockResolvedValueOnce(barCodeMock); // Segunda chamada GET /payments/pay_123/identificationField

      const result = await gateway.getInvoice('pay_123');

      expect(clientMock.get).toHaveBeenNthCalledWith(1, '/payments/pay_123');
      expect(clientMock.get).toHaveBeenNthCalledWith(
        2,
        '/payments/pay_123/identificationField',
      );
      expect(result.gatewayPaymentId).toBe(responseMock.id);
      expect(result.bankSlipBarCode).toBe(barCodeMock.identificationField);
    });
  });

  describe('receiveWebhook', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = {
        ...originalEnv,
        ASAAS_WEBHOOK_TOKEN: 'super-secret-token',
      };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should parse valid webhook and return GatewayWebhookEvent', async () => {
      const body = {
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_123',
          customer: 'cus_123',
          value: 150.0,
          status: 'RECEIVED',
          billingType: 'PIX',
          dueDate: '2026-07-20',
        },
      };

      const result = await gateway.receiveWebhook(body, 'super-secret-token');

      expect(result.gatewayPaymentId).toBe(body.payment.id);
      expect(result.value).toBe(body.payment.value);
    });

    it('should throw InvalidWebhookSignatureError if token mismatch', async () => {
      const body = { event: 'PAYMENT_RECEIVED' };

      await expect(
        gateway.receiveWebhook(body, 'wrong-token'),
      ).rejects.toBeInstanceOf(InvalidWebhookSignatureError);
    });
  });
});
