import type { ProviderType } from '../../generated/prisma/enums.js';

export type PaymentProviderCode = ProviderType | 'AUTO';

export type ProviderCredentials = {
  apiKey: string;
  environment: 'SANDBOX' | 'PRODUCTION';
};

export type CreateProviderCustomerInput = {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  credentials?: ProviderCredentials;
};

export type ProviderCustomerResult = {
  providerCustomerId: string;
  rawPayload?: unknown;
};

export type ProviderSplitRule = {
  recipientId: string;
  type: 'PERCENTAGE' | 'FIXED';
  amount?: number;
  percentage?: number;
  providerWalletId?: string;
};

export type CreateProviderChargeInput = {
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  expiresAt?: string;
  externalReference: string;
  paymentMethods: string[];
  customer: CreateProviderCustomerInput;
  metadata?: Record<string, unknown>;
  credentials?: ProviderCredentials;
  providerCustomerId?: string;
  splitRules?: ProviderSplitRule[];
};

export type ProviderChargeResult = {
  providerChargeId: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  status: string;
  paymentUrl?: string;
  pix?: {
    copyPaste?: string;
    qrCodeUrl?: string;
    expiresAt?: string;
  };
  boleto?: {
    digitableLine?: string;
    barcode?: string;
    bankSlipUrl?: string;
  };
  checkout?: {
    url?: string;
  };
  infiniteTap?: {
    orderNsu: string;
    amountCents: number;
    deepLink: string;
    handle: string;
    instructions: string;
  };
  stonePos?: {
    chargeId: string;
    channel: string;
    amountCents: number;
    deepLink?: string;
    instructions: string;
  };
  rawPayload?: unknown;
};

export type GetProviderChargeInput = {
  providerChargeId: string;
  externalReference?: string;
  credentials?: ProviderCredentials;
};

export type CancelProviderChargeInput = {
  providerChargeId: string;
  credentials?: ProviderCredentials;
};

export type ProviderCancelResult = {
  status: string;
  rawPayload?: unknown;
};

export type RefundProviderPaymentInput = {
  providerPaymentId: string;
  amount?: number;
  reason?: string;
  credentials?: ProviderCredentials;
};

export type CaptureProviderPaymentInput = {
  providerChargeId: string;
  amount?: number;
  credentials?: ProviderCredentials;
};

export type ProviderRefundResult = {
  providerRefundId: string;
  status: string;
  rawPayload?: unknown;
};

export type ProviderWebhookInput = {
  headers: Record<string, string>;
  rawBody: unknown;
};

export type NormalizedProviderEvent = {
  eventType: string;
  eventId?: string;
  providerChargeId?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  subscriptionEvent?: boolean;
  status: string;
  amount?: number;
  paidAt?: string;
  nextDueDate?: string;
  rawPayload: unknown;
};

export interface PaymentProvider {
  createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult>;
  createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult>;
  getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult>;
  cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult>;
  refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult>;
  capturePayment?(input: CaptureProviderPaymentInput): Promise<ProviderChargeResult>;
  parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent>;
}
