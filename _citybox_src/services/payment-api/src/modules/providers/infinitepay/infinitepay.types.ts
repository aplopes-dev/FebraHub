export type InfinitePayCheckoutItem = {
  quantity: number;
  price: number;
  description: string;
};

export type InfinitePayCreateLinkRequest = {
  handle: string;
  items: InfinitePayCheckoutItem[];
  order_nsu?: string;
  redirect_url?: string;
  webhook_url?: string;
  customer?: {
    name?: string;
    email?: string;
    phone_number?: string;
  };
  address?: Record<string, string>;
};

export type InfinitePayCreateLinkResponse = {
  url: string;
  slug?: string;
};

export type InfinitePayPaymentCheckRequest = {
  handle: string;
  order_nsu: string;
  transaction_nsu?: string;
  slug?: string;
};

export type InfinitePayPaymentCheckResponse = {
  success?: boolean;
  paid?: boolean;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
};

export type InfinitePayWebhookPayload = {
  invoice_slug?: string;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
  transaction_nsu?: string;
  order_nsu?: string;
  receipt_url?: string;
  items?: InfinitePayCheckoutItem[];
};

export function toInfinitePayCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromInfinitePayCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function resolveInfinitePayHandle(credentials: { apiKey: string }): string {
  return credentials.apiKey.replace(/^\$/, '').trim();
}

export function isInfiniteTapFlow(paymentMethods: string[]): boolean {
  return paymentMethods.some((method) =>
    ['INFINITE_TAP', 'TAP', 'TAP_TO_PAY'].includes(method.toUpperCase()),
  );
}

export function buildInfiniteTapDeepLink(input: {
  handle: string;
  orderNsu: string;
  amountCents: number;
}): string {
  const template =
    process.env.INFINITEPAY_TAP_DEEPLINK_TEMPLATE?.trim() ??
    'https://checkout.infinitepay.io/tap?handle={handle}&order_nsu={order_nsu}&amount={amount}';
  return template
    .replace('{handle}', encodeURIComponent(input.handle))
    .replace('{order_nsu}', encodeURIComponent(input.orderNsu))
    .replace('{amount}', String(input.amountCents));
}

export function mapInfinitePayCaptureMethod(method?: string): string {
  if (!method) return 'UNKNOWN';
  if (method === 'pix') return 'PIX';
  if (method === 'credit_card') return 'CREDIT_CARD';
  if (method === 'debit_card') return 'DEBIT_CARD';
  return method.toUpperCase();
}
