import type { ProviderCredentials } from '../payment-provider.interface.js';

export type StoneBusinessModel = 'subacquirer' | 'gateway';

export type StoneChargeResponse = {
  id?: string;
  status?: string;
  amount?: number;
  payment_method?: string;
  reference_id?: string;
  card_transaction?: {
    transaction_id?: string;
    operation_id?: string;
    status?: string;
  };
  pix_transaction?: {
    qr_code?: string;
    qr_code_url?: string;
    copy_paste?: string;
    expires_at?: string;
  };
};

export type StoneOpenBankPixResponse = {
  id?: string;
  status?: string;
  amount?: number;
  qr_code?: { content?: string; image?: string };
  qRCode?: { content?: string };
  transaction_id?: string;
};

export function toStoneCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromStoneCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function resolveStoneHost(credentials: ProviderCredentials): string {
  const mode = (process.env.STONE_BUSINESS_MODEL?.trim() ?? 'subacquirer') as StoneBusinessModel;
  const sandbox = credentials.environment !== 'PRODUCTION';
  if (mode === 'gateway') {
    return sandbox ? 'sdx-ecommerce-payments.stone.com.br' : 'ecommerce-payments.stone.com.br';
  }
  return sandbox ? 'sdx-payments.stone.com.br' : 'payments.stone.com.br';
}

export function resolveStoneChannel(paymentMethods: string[]): string {
  if (isStonePosFlow(paymentMethods)) {
    const mobile = paymentMethods.some((m) =>
      ['SMARTPOS', 'TAP_PHONE', 'STONE_MOBILE'].includes(m.toUpperCase()),
    );
    return mobile ? 'standalone_mobile' : 'standalone_device';
  }
  if (paymentMethods.some((m) => m.toUpperCase() === 'PAYMENT_LINK')) {
    return 'payment_link';
  }
  return 'website';
}

export function isStonePosFlow(paymentMethods: string[]): boolean {
  return paymentMethods.some((method) =>
    ['STONE_POS', 'TEF', 'SMARTPOS', 'POS', 'TAP_PHONE', 'STONE_MOBILE'].includes(method.toUpperCase()),
  );
}

export function isStonePixFlow(paymentMethods: string[]): boolean {
  return paymentMethods.some((method) => method.toUpperCase() === 'PIX');
}

export function isStoneCardFlow(paymentMethods: string[]): boolean {
  return paymentMethods.some((method) =>
    ['CREDIT_CARD', 'DEBIT_CARD', 'CARD'].includes(method.toUpperCase()),
  );
}

export function buildStonePosDeepLink(input: {
  chargeId: string;
  amountCents: number;
}): string {
  const template =
    process.env.STONE_POS_DEEPLINK_TEMPLATE?.trim() ??
    'stonepos://charge?id={charge_id}&amount={amount}';
  return template
    .replace('{charge_id}', encodeURIComponent(input.chargeId))
    .replace('{amount}', String(input.amountCents));
}

export type StoneCardMetadata = {
  token: string;
  expirationDate: string;
  operationType?: 'auth_only' | 'auth_and_capture';
  type?: 'credit' | 'debit';
  cvv?: string;
};

export function readStoneCardMetadata(metadata?: Record<string, unknown>): StoneCardMetadata | null {
  const raw = metadata?.stoneCard;
  if (!raw || typeof raw !== 'object') return null;
  const card = raw as StoneCardMetadata;
  if (!card.token?.trim() || !card.expirationDate?.trim()) return null;
  return card;
}

export function readStoneOpenBankAccountId(
  metadata?: Record<string, unknown>,
): string | undefined {
  const fromMeta = metadata?.stoneOpenBankAccountId;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  return process.env.STONE_OPENBANK_ACCOUNT_ID?.trim();
}
