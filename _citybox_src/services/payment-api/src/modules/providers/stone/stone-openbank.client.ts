import type { ProviderCredentials } from '../payment-provider.interface.js';
import { type StoneOpenBankPixResponse, toStoneCents } from './stone.types.js';

export type StoneOpenBankClient = {
  createDynamicPixQr(input: {
    accountId: string;
    amount: number;
    externalReference: string;
    description?: string;
    expiresInSeconds?: number;
  }): Promise<StoneOpenBankPixResponse>;
};

function openBankBaseUrl(credentials: ProviderCredentials): string {
  if (credentials.environment === 'PRODUCTION') {
    return (
      process.env.STONE_OPENBANK_API_BASE_URL?.trim() ?? 'https://api.openbank.stone.com.br'
    ).replace(/\/$/, '');
  }
  return (
    process.env.STONE_OPENBANK_SANDBOX_BASE_URL?.trim() ??
      'https://sandbox-api.openbank.stone.com.br'
  ).replace(/\/$/, '');
}

export function createStoneOpenBankClient(credentials: ProviderCredentials): StoneOpenBankClient {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${openBankBaseUrl(credentials)}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as T) : ({} as T);
    if (!response.ok) {
      throw new Error(
        `Stone OpenBank ${method} ${path} falhou (${response.status}): ${text.slice(0, 400)}`,
      );
    }
    return payload;
  }

  return {
    createDynamicPixQr: (input) =>
      request<StoneOpenBankPixResponse>(
        'POST',
        `/api/v1/dynamic_qr_codes/${encodeURIComponent(input.accountId)}`,
        {
          account_id: input.accountId,
          amount: toStoneCents(input.amount),
          transaction_id: input.externalReference,
          description: input.description ?? `Cobrança ${input.externalReference}`,
          expires_in: input.expiresInSeconds ?? 3600,
        },
      ),
  };
}
