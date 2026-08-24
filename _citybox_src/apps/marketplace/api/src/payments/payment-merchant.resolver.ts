import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentMerchantResolver {
  isConfigured(): boolean {
    return Boolean(process.env.PAYMENT_API_KEY?.trim()) && this.hasMerchantMapping();
  }

  resolveMerchantId(storeId: string): string {
    const map = parseStoreMerchantMap();
    const mapped = map[storeId]?.trim();
    if (mapped) return mapped;

    const fallback = process.env.PAYMENTS_DEFAULT_MERCHANT_ID?.trim();
    if (fallback) return fallback;

    throw new BadRequestException(
      `Merchant de pagamento não configurado para storeId=${storeId}. Defina PAYMENTS_STORE_MERCHANT_MAP ou PAYMENTS_DEFAULT_MERCHANT_ID.`,
    );
  }

  defaultStoreSharePercent(override?: number): number {
    if (override !== undefined) return override;
    const raw = process.env.PAYMENTS_STORE_SHARE_PERCENT?.trim();
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 95;
  }

  private hasMerchantMapping(): boolean {
    if (process.env.PAYMENTS_DEFAULT_MERCHANT_ID?.trim()) return true;
    return Object.keys(parseStoreMerchantMap()).length > 0;
  }
}

function parseStoreMerchantMap(): Record<string, string> {
  const raw = process.env.PAYMENTS_STORE_MERCHANT_MAP?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
        .map(([key, value]) => [key, (value as string).trim()]),
    );
  } catch {
    return {};
  }
}
