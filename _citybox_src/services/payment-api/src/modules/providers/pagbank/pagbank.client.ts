import type { ProviderCredentials } from '../payment-provider.interface.js';
import { pagbankBaseUrl } from './pagbank.types.js';

export class PagBankApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'PagBankApiError';
  }
}

export class PagBankClient {
  constructor(private readonly credentials: ProviderCredentials) {}

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.credentials.apiKey}`,
    };
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${pagbankBaseUrl(this.credentials)}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(Number(process.env.PAGBANK_HTTP_TIMEOUT_MS ?? 15000)),
    });
    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as unknown) : undefined;
    if (!response.ok) {
      throw new PagBankApiError(
        `PagBank ${method} ${path} failed (${response.status})`,
        response.status,
        parsed,
      );
    }
    return parsed as T;
  }
}

export function createPagBankClient(credentials: ProviderCredentials): PagBankClient {
  return new PagBankClient(credentials);
}
