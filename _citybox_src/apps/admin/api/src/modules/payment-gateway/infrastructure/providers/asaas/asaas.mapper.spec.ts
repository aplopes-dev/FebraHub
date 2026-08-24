import { AsaasMapper } from './asaas.mapper';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentCycle } from '../../../domain/enums/payment-cycle.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import {
  AsaasCustomerResponse,
  AsaasSubscriptionResponse,
  AsaasPaymentResponse,
} from './types/asaas.types';
import { AsaasWebhookBody } from './webhooks/asaas-webhook.types';
import { GatewayWebhookEventType } from '../../../domain/entities/gateway-webhook-event.entity';

describe('AsaasMapper', () => {
  describe('Enum mappings', () => {
    it('should map PaymentMethod to AsaasBillingType', () => {
      expect(AsaasMapper.toAsaasBillingType(PaymentMethod.BOLETO)).toBe(
        'BOLETO',
      );
      expect(AsaasMapper.toAsaasBillingType(PaymentMethod.CREDIT_CARD)).toBe(
        'CREDIT_CARD',
      );
      expect(AsaasMapper.toAsaasBillingType(PaymentMethod.PIX)).toBe('PIX');
    });

    it('should map AsaasBillingType to PaymentMethod', () => {
      expect(AsaasMapper.toDomainPaymentMethod('BOLETO')).toBe(
        PaymentMethod.BOLETO,
      );
      expect(AsaasMapper.toDomainPaymentMethod('CREDIT_CARD')).toBe(
        PaymentMethod.CREDIT_CARD,
      );
      expect(AsaasMapper.toDomainPaymentMethod('PIX')).toBe(PaymentMethod.PIX);
      expect(AsaasMapper.toDomainPaymentMethod('UNDEFINED')).toBe(
        PaymentMethod.BOLETO,
      );
    });

    it('should map PaymentCycle to AsaasCycle', () => {
      expect(AsaasMapper.toAsaasCycle(PaymentCycle.MONTHLY)).toBe('MONTHLY');
      expect(AsaasMapper.toAsaasCycle(PaymentCycle.YEARLY)).toBe('YEARLY');
      expect(AsaasMapper.toAsaasCycle('YEARLY')).toBe('YEARLY');
    });

    it('should map AsaasCycle to PaymentCycle', () => {
      expect(AsaasMapper.toDomainPaymentCycle('MONTHLY')).toBe(
        PaymentCycle.MONTHLY,
      );
      expect(AsaasMapper.toDomainPaymentCycle('YEARLY')).toBe(
        PaymentCycle.YEARLY,
      );
    });

    it('should map AsaasSubscriptionStatus to SubscriptionStatus', () => {
      expect(AsaasMapper.toDomainSubscriptionStatus('ACTIVE')).toBe(
        SubscriptionStatus.ACTIVE,
      );
      expect(AsaasMapper.toDomainSubscriptionStatus('EXPIRED')).toBe(
        SubscriptionStatus.CANCELLED,
      );
      expect(AsaasMapper.toDomainSubscriptionStatus('INACTIVE')).toBe(
        SubscriptionStatus.CANCELLED,
      );
    });

    it('should map AsaasPaymentStatus to InvoiceStatus', () => {
      expect(AsaasMapper.toDomainInvoiceStatus('PENDING')).toBe(
        InvoiceStatus.PENDING,
      );
      expect(AsaasMapper.toDomainInvoiceStatus('RECEIVED')).toBe(
        InvoiceStatus.PAID,
      );
      expect(AsaasMapper.toDomainInvoiceStatus('CONFIRMED')).toBe(
        InvoiceStatus.PAID,
      );
      expect(AsaasMapper.toDomainInvoiceStatus('OVERDUE')).toBe(
        InvoiceStatus.OVERDUE,
      );
      expect(AsaasMapper.toDomainInvoiceStatus('REFUNDED')).toBe(
        InvoiceStatus.REFUNDED,
      );
      expect(AsaasMapper.toDomainInvoiceStatus('DELETED')).toBe(
        InvoiceStatus.CANCELLED,
      );
    });
  });

  describe('Request mapping', () => {
    it('should map CreateCustomerGatewayInput to AsaasCreateCustomerDto', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        mobilePhone: '11999999999',
        zipCode: '01001000',
        street: 'Main St',
        streetNumber: '123',
        complement: 'Apt 1',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
      };

      const result = AsaasMapper.toAsaasCreateCustomer(input);

      expect(result.name).toBe(input.name);
      expect(result.email).toBe(input.email);
      expect(result.cpfCnpj).toBe(input.document);
      expect(result.mobilePhone).toBe(input.mobilePhone);
      expect(result.postalCode).toBe(input.zipCode);
      expect(result.address).toBe(input.street);
      expect(result.addressNumber).toBe(input.streetNumber);
      expect(result.complement).toBe(input.complement);
      expect(result.province).toBe(input.neighborhood);
      expect(result.notificationDisabled).toBe(true);
    });
  });

  describe('Response mapping', () => {
    it('should map AsaasCustomerResponse to GatewayCustomer entity', () => {
      const response: AsaasCustomerResponse = {
        id: 'cus_123',
        name: 'John Doe',
        email: 'john@example.com',
        cpfCnpj: '12345678901',
      };

      const result = AsaasMapper.toDomainCustomer(response);

      expect(result.gatewayCustomerId).toBe(response.id);
      expect(result.name).toBe(response.name);
      expect(result.email).toBe(response.email);
      expect(result.document).toBe(response.cpfCnpj);
    });

    it('should map AsaasSubscriptionResponse to GatewaySubscription entity', () => {
      const response: AsaasSubscriptionResponse = {
        id: 'sub_123',
        customer: 'cus_123',
        billingType: 'BOLETO',
        value: 100.0,
        cycle: 'MONTHLY',
        nextDueDate: '2026-08-15',
        status: 'ACTIVE',
      };

      const result = AsaasMapper.toDomainSubscription(response);

      expect(result.gatewaySubscriptionId).toBe(response.id);
      expect(result.gatewayCustomerId).toBe(response.customer);
      expect(result.value).toBe(response.value);
      expect(result.billingType).toBe(PaymentMethod.BOLETO);
      expect(result.cycle).toBe(PaymentCycle.MONTHLY);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.nextDueDate.toISOString()).toContain('2026-08-15');
    });

    it('should map AsaasPaymentResponse to GatewayInvoice entity', () => {
      const response: AsaasPaymentResponse = {
        id: 'pay_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        billingType: 'PIX',
        value: 150.0,
        dueDate: '2026-07-20',
        status: 'PENDING',
        invoiceUrl: 'http://invoice.url',
      };

      const result = AsaasMapper.toDomainInvoice(response, null, null);

      expect(result.gatewayPaymentId).toBe(response.id);
      expect(result.gatewayCustomerId).toBe(response.customer);
      expect(result.gatewaySubscriptionId).toBe(response.subscription);
      expect(result.value).toBe(response.value);
      expect(result.billingType).toBe(PaymentMethod.PIX);
      expect(result.dueDate.toISOString()).toContain('2026-07-20');
      expect(result.status).toBe(InvoiceStatus.PENDING);
      expect(result.invoiceUrl).toBe(response.invoiceUrl);
    });
  });

  describe('Webhook mapping', () => {
    it('should map AsaasWebhookBody for payment received to GatewayWebhookEvent', () => {
      const body: AsaasWebhookBody = {
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          value: 150.0,
          status: 'RECEIVED',
          billingType: 'PIX',
          dueDate: '2026-07-20',
          paymentDate: '2026-07-15T10:00:00-03:00',
        },
      };

      const result = AsaasMapper.toDomainWebhookEvent(body);

      expect(result.event).toBe(GatewayWebhookEventType.PAYMENT_RECEIVED);
      expect(result.gatewayPaymentId).toBe(body.payment?.id);
      expect(result.gatewaySubscriptionId).toBe(body.payment?.subscription);
      expect(result.value).toBe(body.payment?.value);
      expect(result.paidAt).toBeInstanceOf(Date);
      expect(result.billingType).toBe(PaymentMethod.PIX);
      expect(result.invoiceStatus).toBe(InvoiceStatus.PAID);
    });
  });
});
