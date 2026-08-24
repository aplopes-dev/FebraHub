export type PaymentChargeCustomer = {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
};

export type PaymentChargeItem = {
  externalItemId?: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
};

export type PaymentSplitRule = {
  recipientId: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
};

export type CreatePaymentChargeInput = {
  sourceSystem: string;
  externalReference: string;
  merchantId: string;
  amount: number;
  paymentMethods: string[];
  customer: PaymentChargeCustomer;
  description?: string;
  currency?: string;
  dueDate?: string;
  expiresAt?: string;
  provider?: string;
  routingStrategy?: string;
  items?: PaymentChargeItem[];
  metadata?: Record<string, unknown>;
  splitRules?: PaymentSplitRule[];
};

export type PaymentChargeResponse = {
  id: string;
  status: string;
  provider?: string;
  providerReference?: string | null;
  sourceSystem: string;
  externalReference: string;
  merchantId: string;
  amount: number;
  currency?: string;
  paymentUrl?: string | null;
  paymentMethods?: string[];
  pix?: Record<string, unknown>;
  boleto?: Record<string, unknown>;
  checkout?: Record<string, unknown>;
  infiniteTap?: Record<string, unknown>;
  stonePos?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  splits?: Array<Record<string, unknown>>;
};

export type PaymentApiRequestOptions = {
  idempotencyKey: string;
  correlationId?: string;
};
