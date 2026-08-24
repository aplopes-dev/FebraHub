import { GatewayCustomer } from '../entities/gateway-customer.entity';
import { GatewaySubscription } from '../entities/gateway-subscription.entity';
import { GatewayInvoice } from '../entities/gateway-invoice.entity';
import { GatewayWebhookEvent } from '../entities/gateway-webhook-event.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentCycle } from '../enums/payment-cycle.enum';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface CreateCustomerGatewayInput {
  name: string;
  email: string;
  document: string;
  mobilePhone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  externalReference?: string | null;
}

export interface UpdateCustomerGatewayInput {
  name?: string;
  email?: string;
  document?: string;
  phone?: string | null;
  zipCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface CreateSubscriptionGatewayInput {
  gatewayCustomerId: string;
  value: number;
  billingType: PaymentMethod;
  cycle: PaymentCycle;
  nextDueDate: Date;
  description?: string | null;
  externalReference?: string | null;
}

export interface CreateInvoiceGatewayInput {
  gatewayCustomerId: string;
  value: number;
  billingType: PaymentMethod;
  dueDate: Date;
  description?: string | null;
}

export interface PaymentGateway {
  createCustomer(input: CreateCustomerGatewayInput): Promise<GatewayCustomer>;
  updateCustomer(
    gatewayCustomerId: string,
    input: UpdateCustomerGatewayInput,
  ): Promise<GatewayCustomer>;
  createSubscription(
    input: CreateSubscriptionGatewayInput,
  ): Promise<GatewaySubscription>;
  cancelSubscription(gatewaySubscriptionId: string): Promise<void>;
  createInvoice(input: CreateInvoiceGatewayInput): Promise<GatewayInvoice>;
  cancelInvoice(gatewayPaymentId: string): Promise<void>;
  receiveWebhook(
    body: any,
    signatureHeader?: string,
  ): Promise<GatewayWebhookEvent>;
  getSubscriptionInvoices(
    gatewaySubscriptionId: string,
  ): Promise<GatewayInvoice[]>;
  getInvoice(gatewayPaymentId: string): Promise<GatewayInvoice>;
}
