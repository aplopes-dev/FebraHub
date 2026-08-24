import {
  PaymentGateway,
  CreateCustomerGatewayInput,
  UpdateCustomerGatewayInput,
  CreateSubscriptionGatewayInput,
  CreateInvoiceGatewayInput,
} from '../domain/providers/payment-gateway.interface';
import { GatewayCustomer } from '../domain/entities/gateway-customer.entity';
import { GatewaySubscription } from '../domain/entities/gateway-subscription.entity';
import { GatewayInvoice } from '../domain/entities/gateway-invoice.entity';
import {
  GatewayWebhookEvent,
  GatewayWebhookEventType,
} from '../domain/entities/gateway-webhook-event.entity';
import { SubscriptionStatus } from '../domain/enums/subscription-status.enum';
import { InvoiceStatus } from '../domain/enums/invoice-status.enum';

export class FakePaymentGateway implements PaymentGateway {
  customers: GatewayCustomer[] = [];
  subscriptions: GatewaySubscription[] = [];
  invoices: GatewayInvoice[] = [];
  cancelledSubscriptions: string[] = [];
  cancelledInvoices: string[] = [];

  async createCustomer(
    input: CreateCustomerGatewayInput,
  ): Promise<GatewayCustomer> {
    const customer = GatewayCustomer.create({
      gatewayCustomerId: `cus_${Math.random().toString(36).substring(7)}`,
      name: input.name,
      email: input.email,
      document: input.document,
    });
    this.customers.push(customer);
    return customer;
  }

  async updateCustomer(
    gatewayCustomerId: string,
    input: UpdateCustomerGatewayInput,
  ): Promise<GatewayCustomer> {
    const customerIndex = this.customers.findIndex(
      (c) => c.gatewayCustomerId === gatewayCustomerId,
    );
    const existing = this.customers[customerIndex];
    const updated = GatewayCustomer.create({
      gatewayCustomerId,
      name: input.name !== undefined ? input.name : existing?.name || '',
      email: input.email !== undefined ? input.email : existing?.email || '',
      document:
        input.document !== undefined
          ? input.document
          : existing?.document || '',
    });
    if (customerIndex !== -1) {
      this.customers[customerIndex] = updated;
    } else {
      this.customers.push(updated);
    }
    return updated;
  }

  async createSubscription(
    input: CreateSubscriptionGatewayInput,
  ): Promise<GatewaySubscription> {
    const subscription = GatewaySubscription.create({
      gatewaySubscriptionId: `sub_${Math.random().toString(36).substring(7)}`,
      gatewayCustomerId: input.gatewayCustomerId,
      value: input.value,
      status: SubscriptionStatus.ACTIVE,
      billingType: input.billingType,
      cycle: input.cycle,
      nextDueDate: input.nextDueDate,
      description: input.description,
    });
    this.subscriptions.push(subscription);
    return subscription;
  }

  async cancelSubscription(gatewaySubscriptionId: string): Promise<void> {
    this.cancelledSubscriptions.push(gatewaySubscriptionId);
    const subIndex = this.subscriptions.findIndex(
      (s) => s.gatewaySubscriptionId === gatewaySubscriptionId,
    );
    if (subIndex !== -1) {
      const existing = this.subscriptions[subIndex];
      this.subscriptions[subIndex] = GatewaySubscription.create({
        ...existing.props,
        status: SubscriptionStatus.CANCELLED,
      });
    }
  }

  async createInvoice(
    input: CreateInvoiceGatewayInput,
  ): Promise<GatewayInvoice> {
    const invoice = GatewayInvoice.create({
      gatewayPaymentId: `pay_${Math.random().toString(36).substring(7)}`,
      gatewayCustomerId: input.gatewayCustomerId,
      value: input.value,
      status: InvoiceStatus.PENDING,
      billingType: input.billingType,
      dueDate: input.dueDate,
      description: input.description,
      invoiceUrl: `https://invoice.url/${Math.random().toString(36).substring(7)}`,
    });
    this.invoices.push(invoice);
    return invoice;
  }

  async cancelInvoice(gatewayPaymentId: string): Promise<void> {
    this.cancelledInvoices.push(gatewayPaymentId);
    const invIndex = this.invoices.findIndex(
      (i) => i.gatewayPaymentId === gatewayPaymentId,
    );
    if (invIndex !== -1) {
      const existing = this.invoices[invIndex];
      this.invoices[invIndex] = GatewayInvoice.create({
        ...existing.props,
        status: InvoiceStatus.CANCELLED,
      });
    }
  }

  async receiveWebhook(
    body: any,
    signatureHeader?: string,
  ): Promise<GatewayWebhookEvent> {
    if (signatureHeader === 'invalid') {
      throw new Error('Invalid signature');
    }
    return GatewayWebhookEvent.create({
      event: GatewayWebhookEventType.PAYMENT_RECEIVED,
      gatewayPaymentId: body.paymentId || 'pay_123',
      value: body.value || 100,
      paidAt: new Date(),
    });
  }

  async getSubscriptionInvoices(
    gatewaySubscriptionId: string,
  ): Promise<GatewayInvoice[]> {
    const existing = this.invoices.filter(
      (i) => i.gatewaySubscriptionId === gatewaySubscriptionId,
    );
    if (existing.length > 0) {
      return existing;
    }

    const sub = this.subscriptions.find(
      (s) => s.gatewaySubscriptionId === gatewaySubscriptionId,
    );
    if (!sub) return [];

    const mockInvoice = GatewayInvoice.create({
      gatewayPaymentId: `pay_${Math.random().toString(36).substring(7)}`,
      gatewayCustomerId: sub.gatewayCustomerId,
      gatewaySubscriptionId: sub.gatewaySubscriptionId,
      value: sub.value,
      status: InvoiceStatus.PENDING,
      billingType: sub.billingType,
      dueDate: sub.nextDueDate,
      description: sub.description || 'Assinatura',
      invoiceUrl: `https://invoice.url/${Math.random().toString(36).substring(7)}`,
    });

    this.invoices.push(mockInvoice);
    return [mockInvoice];
  }

  async getInvoice(gatewayPaymentId: string): Promise<GatewayInvoice> {
    const invoice = this.invoices.find(
      (i) => i.gatewayPaymentId === gatewayPaymentId,
    );
    if (!invoice) {
      throw new Error(
        `Invoice ${gatewayPaymentId} not found in FakePaymentGateway`,
      );
    }
    return invoice;
  }
}
