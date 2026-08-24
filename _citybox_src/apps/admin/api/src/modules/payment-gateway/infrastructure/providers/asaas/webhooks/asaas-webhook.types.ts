import {
  AsaasPaymentStatus,
  AsaasSubscriptionStatus,
  AsaasBillingType,
} from '../types/asaas.types';

export type AsaasWebhookEventName =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_DELETED';

export interface AsaasWebhookPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  status: AsaasPaymentStatus;
  billingType: AsaasBillingType;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
}

export interface AsaasWebhookSubscription {
  id: string;
  customer: string;
  status: AsaasSubscriptionStatus;
}

export interface AsaasWebhookBody {
  event: AsaasWebhookEventName;
  payment?: AsaasWebhookPayment;
  subscription?: AsaasWebhookSubscription;
}
