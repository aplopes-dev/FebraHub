import type { ProviderCredentials } from '../payment-provider.interface.js';
import { asaasBaseUrl } from './asaas.types.js';

export class AsaasApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

export class AsaasClient {
  constructor(private readonly credentials: ProviderCredentials) {}

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      access_token: this.credentials.apiKey,
    };
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${asaasBaseUrl(this.credentials)}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(Number(process.env.ASAAS_HTTP_TIMEOUT_MS ?? 15000)),
    });
    const text = await response.text();
    const parsed = text ? (JSON.parse(text) as unknown) : undefined;
    if (!response.ok) {
      throw new AsaasApiError(
        `Asaas ${method} ${path} failed (${response.status})`,
        response.status,
        parsed,
      );
    }
    return parsed as T;
  }
}

export function createAsaasClient(credentials: ProviderCredentials): AsaasClient {
  return new AsaasClient(credentials);
}
