import {
  CreateCustomerGatewayInput,
  UpdateCustomerGatewayInput,
  CreateSubscriptionGatewayInput,
  CreateInvoiceGatewayInput,
} from '../../../domain/providers/payment-gateway.interface';
import { AsaasCreateCustomerDto } from './dto/create-customer.dto';
import { AsaasUpdateCustomerDto } from './dto/update-customer.dto';
import { AsaasCreateSubscriptionDto } from './dto/create-subscription.dto';
import { AsaasCreatePaymentDto } from './dto/create-payment.dto';
import {
  AsaasBillingType,
  AsaasCycle,
  AsaasCustomerResponse,
  AsaasSubscriptionResponse,
  AsaasPaymentResponse,
  AsaasSubscriptionStatus,
  AsaasPaymentStatus,
  AsaasPixQrCodeResponse,
  AsaasIdentificationFieldResponse,
} from './types/asaas.types';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentCycle } from '../../../domain/enums/payment-cycle.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { GatewayCustomer } from '../../../domain/entities/gateway-customer.entity';
import { GatewaySubscription } from '../../../domain/entities/gateway-subscription.entity';
import { GatewayInvoice } from '../../../domain/entities/gateway-invoice.entity';
import {
  AsaasWebhookBody,
  AsaasWebhookEventName,
} from './webhooks/asaas-webhook.types';
import {
  GatewayWebhookEvent,
  GatewayWebhookEventType,
} from '../../../domain/entities/gateway-webhook-event.entity';

export class AsaasMapper {
  static toAsaasBillingType(method: PaymentMethod): AsaasBillingType {
    const map: Record<PaymentMethod, AsaasBillingType> = {
      [PaymentMethod.BOLETO]: 'BOLETO',
      [PaymentMethod.CREDIT_CARD]: 'CREDIT_CARD',
      [PaymentMethod.PIX]: 'PIX',
      [PaymentMethod.UNDEFINED]: 'UNDEFINED',
    };
    return map[method] || 'UNDEFINED';
  }

  static toDomainPaymentMethod(billingType: AsaasBillingType): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      BOLETO: PaymentMethod.BOLETO,
      CREDIT_CARD: PaymentMethod.CREDIT_CARD,
      PIX: PaymentMethod.PIX,
    };
    return map[billingType] || PaymentMethod.BOLETO;
  }

  static toAsaasCycle(cycle: PaymentCycle | string): AsaasCycle {
    const map: Record<string, AsaasCycle> = {
      [PaymentCycle.WEEKLY]: 'WEEKLY',
      [PaymentCycle.BIWEEKLY]: 'BIWEEKLY',
      [PaymentCycle.MONTHLY]: 'MONTHLY',
      [PaymentCycle.QUARTERLY]: 'QUARTERLY',
      [PaymentCycle.SEMIANNUALLY]: 'SEMIANNUALLY',
      [PaymentCycle.YEARLY]: 'YEARLY',
    };
    return map[cycle] || 'MONTHLY';
  }

  static toDomainPaymentCycle(cycle: AsaasCycle): PaymentCycle {
    const map: Record<string, PaymentCycle> = {
      WEEKLY: PaymentCycle.WEEKLY,
      BIWEEKLY: PaymentCycle.BIWEEKLY,
      MONTHLY: PaymentCycle.MONTHLY,
      QUARTERLY: PaymentCycle.QUARTERLY,
      SEMIANNUALLY: PaymentCycle.SEMIANNUALLY,
      YEARLY: PaymentCycle.YEARLY,
    };
    return map[cycle] || PaymentCycle.MONTHLY;
  }

  static toDomainSubscriptionStatus(
    status: AsaasSubscriptionStatus,
  ): SubscriptionStatus {
    const map: Record<AsaasSubscriptionStatus, SubscriptionStatus> = {
      ACTIVE: SubscriptionStatus.ACTIVE,
      EXPIRED: SubscriptionStatus.CANCELLED,
      INACTIVE: SubscriptionStatus.CANCELLED,
    };
    return map[status] || SubscriptionStatus.PENDING;
  }

  static toDomainInvoiceStatus(status: AsaasPaymentStatus): InvoiceStatus {
    const map: Partial<Record<AsaasPaymentStatus, InvoiceStatus>> = {
      PENDING: InvoiceStatus.PENDING,
      RECEIVED: InvoiceStatus.PAID,
      CONFIRMED: InvoiceStatus.PAID,
      OVERDUE: InvoiceStatus.OVERDUE,
      REFUNDED: InvoiceStatus.REFUNDED,
      RECEIVED_IN_CASH: InvoiceStatus.PAID,
      DELETED: InvoiceStatus.CANCELLED,
    };
    return map[status] || InvoiceStatus.PENDING;
  }

  static toAsaasCreateCustomer(
    input: CreateCustomerGatewayInput,
  ): AsaasCreateCustomerDto {
    return {
      name: input.name,
      email: input.email,
      cpfCnpj: input.document,
      mobilePhone: input.mobilePhone,
      postalCode: input.zipCode,
      address: input.street,
      addressNumber: input.streetNumber,
      complement: input.complement,
      province: input.neighborhood,
      notificationDisabled: true,
    };
  }

  static toAsaasUpdateCustomer(
    input: UpdateCustomerGatewayInput,
  ): AsaasUpdateCustomerDto {
    const dto: AsaasUpdateCustomerDto = {};
    if (input.name !== undefined) dto.name = input.name;
    if (input.email !== undefined) dto.email = input.email;
    if (input.document !== undefined) dto.cpfCnpj = input.document;
    if (input.phone !== undefined) {
      dto.phone = input.phone;
      dto.mobilePhone = input.phone;
    }
    if (input.zipCode !== undefined) dto.postalCode = input.zipCode;
    if (input.street !== undefined) dto.address = input.street;
    if (input.streetNumber !== undefined)
      dto.addressNumber = input.streetNumber;
    if (input.complement !== undefined) dto.complement = input.complement;
    if (input.neighborhood !== undefined) dto.province = input.neighborhood;
    return dto;
  }

  static toAsaasCreateSubscription(
    input: CreateSubscriptionGatewayInput,
  ): AsaasCreateSubscriptionDto {
    return {
      customer: input.gatewayCustomerId,
      billingType: this.toAsaasBillingType(input.billingType),
      value: input.value,
      nextDueDate: this.formatDate(input.nextDueDate),
      cycle: this.toAsaasCycle(input.cycle),
      description: input.description,
    };
  }

  static toAsaasCreatePayment(
    input: CreateInvoiceGatewayInput,
  ): AsaasCreatePaymentDto {
    return {
      customer: input.gatewayCustomerId,
      billingType: this.toAsaasBillingType(input.billingType),
      value: input.value,
      dueDate: this.formatDate(input.dueDate),
      description: input.description,
    };
  }

  static toDomainCustomer(response: AsaasCustomerResponse): GatewayCustomer {
    return GatewayCustomer.create({
      gatewayCustomerId: response.id,
      name: response.name,
      email: response.email,
      document: response.cpfCnpj,
    });
  }

  static toDomainSubscription(
    response: AsaasSubscriptionResponse,
  ): GatewaySubscription {
    return GatewaySubscription.create({
      gatewaySubscriptionId: response.id,
      gatewayCustomerId: response.customer,
      value: response.value,
      status: this.toDomainSubscriptionStatus(response.status),
      billingType: this.toDomainPaymentMethod(response.billingType),
      cycle: this.toDomainPaymentCycle(response.cycle),
      nextDueDate: this.parseDate(response.nextDueDate),
      description: response.description || null,
    });
  }

  static toDomainInvoice(
    response: AsaasPaymentResponse,
    pixResponse?: AsaasPixQrCodeResponse | null,
    barCodeResponse?: AsaasIdentificationFieldResponse | null,
  ): GatewayInvoice {
    return GatewayInvoice.create({
      gatewayPaymentId: response.id,
      gatewayCustomerId: response.customer,
      gatewaySubscriptionId: response.subscription || null,
      value: response.value,
      status: this.toDomainInvoiceStatus(response.status),
      billingType: this.toDomainPaymentMethod(response.billingType),
      dueDate: this.parseDate(response.dueDate),
      invoiceUrl: response.invoiceUrl || null,
      bankSlipUrl: response.bankSlipUrl || null,
      bankSlipBarCode: barCodeResponse?.identificationField || null,
      pixQrCode: pixResponse?.encodedImage || null,
      pixCopyPaste: pixResponse?.payload || null,
      description: response.description || null,
    });
  }

  static toDomainWebhookEventType(
    event: AsaasWebhookEventName,
  ): GatewayWebhookEventType {
    const map: Record<AsaasWebhookEventName, GatewayWebhookEventType> = {
      PAYMENT_CREATED: GatewayWebhookEventType.PAYMENT_CREATED,
      PAYMENT_UPDATED: GatewayWebhookEventType.PAYMENT_UPDATED,
      PAYMENT_CONFIRMED: GatewayWebhookEventType.PAYMENT_CONFIRMED,
      PAYMENT_RECEIVED: GatewayWebhookEventType.PAYMENT_RECEIVED,
      PAYMENT_OVERDUE: GatewayWebhookEventType.PAYMENT_OVERDUE,
      PAYMENT_DELETED: GatewayWebhookEventType.PAYMENT_DELETED,
      SUBSCRIPTION_CREATED: GatewayWebhookEventType.SUBSCRIPTION_CREATED,
      SUBSCRIPTION_DELETED: GatewayWebhookEventType.SUBSCRIPTION_DELETED,
    };
    return map[event] || GatewayWebhookEventType.PAYMENT_CREATED;
  }

  static toDomainWebhookEvent(body: AsaasWebhookBody): GatewayWebhookEvent {
    return GatewayWebhookEvent.create({
      event: this.toDomainWebhookEventType(body.event),
      gatewayPaymentId: body.payment?.id || null,
      gatewaySubscriptionId:
        body.payment?.subscription || body.subscription?.id || null,
      value: body.payment?.value || null,
      paidAt: body.payment?.paymentDate
        ? this.parseDate(body.payment.paymentDate)
        : null,
      billingType: body.payment?.billingType
        ? this.toDomainPaymentMethod(body.payment.billingType)
        : null,
      invoiceStatus: body.payment?.status
        ? this.toDomainInvoiceStatus(body.payment.status)
        : null,
      invoiceUrl: body.payment?.invoiceUrl,
      subscriptionStatus: body.subscription?.status
        ? this.toDomainSubscriptionStatus(body.subscription.status)
        : body.payment?.status === 'DELETED'
          ? SubscriptionStatus.CANCELLED
          : null,
    });
  }

  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    if (dateStr.includes('T') || dateStr.includes(' ')) {
      return new Date(dateStr);
    }
    return new Date(`${dateStr}T12:00:00-03:00`);
  }
}
