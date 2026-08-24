import type { ProviderCredentials } from '../payment-provider.interface.js';

export type AsaasCustomerPayload = {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
};

export type AsaasPaymentPayload = {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
};

export type AsaasPaymentResponse = {
  id: string;
  status: string;
  billingType: string;
  value: number;
  netValue?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  dueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  externalReference?: string;
};

export type AsaasPixQrCodeResponse = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

export type AsaasWebhookPayload = {
  event: string;
  payment?: AsaasPaymentResponse & { subscription?: string };
  subscription?: AsaasSubscriptionResponse;
};

export type AsaasSubscriptionResponse = {
  id: string;
  status?: string;
  cycle?: string;
  billingType?: string;
  value?: number;
  nextDueDate?: string;
  externalReference?: string;
};

export function asaasBaseUrl(credentials: ProviderCredentials): string {
  return credentials.environment === 'PRODUCTION'
    ? 'https://api.asaas.com/api/v3'
    : 'https://sandbox.asaas.com/api/v3';
}

export function resolveAsaasBillingType(paymentMethods: string[]): AsaasPaymentPayload['billingType'] {
  const normalized = paymentMethods.map((m) => m.toUpperCase());
  if (normalized.length > 1) return 'UNDEFINED';
  if (normalized.includes('PIX')) return 'PIX';
  if (normalized.includes('BOLETO')) return 'BOLETO';
  if (normalized.includes('CREDIT_CARD') || normalized.includes('CARD')) return 'CREDIT_CARD';
  return 'UNDEFINED';
}

export function formatAsaasDueDate(dueDate?: string, expiresAt?: string): string {
  if (dueDate) return dueDate.slice(0, 10);
  if (expiresAt) return expiresAt.slice(0, 10);
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

const BILLING_CYCLE_MAP: Record<string, string> = {
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  BIMONTHLY: 'BIMONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMIANNUALLY: 'SEMIANNUALLY',
  YEARLY: 'YEARLY',
};

export function resolveAsaasBillingCycle(cycle: string): string {
  return BILLING_CYCLE_MAP[cycle.toUpperCase()] ?? 'MONTHLY';
}

export function resolveAsaasPaymentMethod(method: string): AsaasPaymentPayload['billingType'] {
  const normalized = method.toUpperCase();
  if (normalized === 'PIX') return 'PIX';
  if (normalized === 'BOLETO') return 'BOLETO';
  if (normalized === 'CREDIT_CARD' || normalized === 'CARD') return 'CREDIT_CARD';
  return 'UNDEFINED';
}
