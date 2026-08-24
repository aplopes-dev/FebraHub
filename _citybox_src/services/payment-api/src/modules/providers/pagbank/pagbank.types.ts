import type { ProviderCredentials } from '../payment-provider.interface.js';

export type PagBankLink = {
  rel: string;
  href: string;
  media?: string;
  type?: string;
};

export type PagBankCharge = {
  id: string;
  reference_id?: string;
  status: string;
  created_at?: string;
  paid_at?: string;
  amount?: { value: number; currency?: string };
  payment_method?: {
    type?: string;
    boleto?: { formatted_barcode?: string; barcode?: string };
  };
  links?: PagBankLink[];
};

export type PagBankQrCode = {
  id?: string;
  text?: string;
  expiration_date?: string;
  amount?: { value: number };
  links?: PagBankLink[];
};

export type PagBankOrderResponse = {
  id: string;
  reference_id?: string;
  status?: string;
  charges?: PagBankCharge[];
  qr_codes?: PagBankQrCode[];
  links?: PagBankLink[];
};

export type PagBankCheckoutResponse = {
  id: string;
  reference_id?: string;
  status?: string;
  links?: PagBankLink[];
};

export type PagBankWebhookPayload = PagBankOrderResponse & {
  event?: string;
};

export function pagbankBaseUrl(credentials: ProviderCredentials): string {
  return credentials.environment === 'PRODUCTION'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com';
}

export function toPagBankCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromPagBankCents(value: number): number {
  return value / 100;
}

export function resolvePagBankFlow(
  paymentMethods: string[],
): 'PIX' | 'BOLETO' | 'CHECKOUT' {
  const normalized = paymentMethods.map((m) => m.toUpperCase());
  if (normalized.length === 1 && normalized.includes('PIX')) return 'PIX';
  if (normalized.length === 1 && normalized.includes('BOLETO')) return 'BOLETO';
  return 'CHECKOUT';
}

export function resolvePagBankPaymentMethods(paymentMethods: string[]): string[] {
  const map: Record<string, string> = {
    PIX: 'PIX',
    BOLETO: 'BOLETO',
    CREDIT_CARD: 'CREDIT_CARD',
    CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
  };
  const resolved = paymentMethods
    .map((m) => map[m.toUpperCase()])
    .filter((m): m is string => Boolean(m));
  return [...new Set(resolved.length ? resolved : ['PIX', 'BOLETO', 'CREDIT_CARD'])];
}

export function findPagBankLink(links: PagBankLink[] | undefined, rel: string): string | undefined {
  return links?.find((link) => link.rel === rel)?.href;
}

export function formatPagBankDueDate(dueDate?: string, expiresAt?: string): string {
  if (dueDate) return dueDate.slice(0, 10);
  if (expiresAt) return expiresAt.slice(0, 10);
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export function buildPagBankCustomer(input: {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}) {
  const taxId = input.cpfCnpj.replace(/\D/g, '');
  const phoneDigits = input.phone?.replace(/\D/g, '') ?? '';
  return {
    name: input.name,
    email: input.email ?? `${taxId}@pagbank-placeholder.citybox.dev`,
    tax_id: taxId,
    ...(phoneDigits.length >= 10
      ? {
          phones: [
            {
              country: '55',
              area: phoneDigits.slice(0, 2),
              number: phoneDigits.slice(2),
              type: 'MOBILE',
            },
          ],
        }
      : {}),
  };
}
