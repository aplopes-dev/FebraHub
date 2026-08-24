import type { ProviderType } from '../../generated/prisma/enums.js';
import type { ProviderCredentials, CreateProviderCustomerInput } from './payment-provider.interface.js';

export type CreateProviderSubscriptionInput = {
  amount: number;
  currency: string;
  description?: string;
  externalReference: string;
  billingCycle: string;
  paymentMethod: string;
  nextDueDate: string;
  customer: CreateProviderCustomerInput;
  credentials?: ProviderCredentials;
  providerCustomerId?: string;
  metadata?: Record<string, unknown>;
};

export type ProviderSubscriptionResult = {
  providerSubscriptionId: string;
  status: string;
  nextDueDate?: string;
  rawPayload?: unknown;
};

export type UpdateProviderSubscriptionInput = {
  providerSubscriptionId: string;
  status?: 'ACTIVE' | 'INACTIVE';
  nextDueDate?: string;
  credentials?: ProviderCredentials;
};

export type CancelProviderSubscriptionInput = {
  providerSubscriptionId: string;
  credentials?: ProviderCredentials;
};

export interface SubscriptionProvider {
  createSubscription(input: CreateProviderSubscriptionInput): Promise<ProviderSubscriptionResult>;
  updateSubscription(input: UpdateProviderSubscriptionInput): Promise<ProviderSubscriptionResult>;
  cancelSubscription(input: CancelProviderSubscriptionInput): Promise<ProviderSubscriptionResult>;
}

export function isSubscriptionProvider(
  provider: { createSubscription?: SubscriptionProvider['createSubscription'] },
): provider is SubscriptionProvider {
  return typeof provider.createSubscription === 'function';
}

export type SubscriptionWebhookContext = {
  provider: ProviderType;
  eventType: string;
  providerSubscriptionId?: string;
  status: string;
  nextDueDate?: string;
  providerChargeId?: string;
  amount?: number;
  rawPayload: unknown;
};
