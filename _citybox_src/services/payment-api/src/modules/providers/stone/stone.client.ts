import type { ProviderCredentials } from '../payment-provider.interface.js';
import { resolveStoneHost, type StoneChargeResponse } from './stone.types.js';

export type StoneClient = {
  createCharge(body: Record<string, unknown>): Promise<StoneChargeResponse>;
  getCharge(id: string): Promise<StoneChargeResponse>;
  captureCharge(id: string, amount: number): Promise<StoneChargeResponse>;
  cancelCharge(id: string): Promise<StoneChargeResponse>;
};

function baseUrl(): string {
  return (process.env.STONE_API_BASE_URL?.trim() ?? 'https://payments.stone.com.br/v1').replace(
    /\/$/,
    '',
  );
}

export function createStoneClient(credentials: ProviderCredentials): StoneClient {
  const host = resolveStoneHost(credentials);

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
        Host: host,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as T) : ({} as T);
    if (!response.ok) {
      throw new Error(`Stone ${method} ${path} falhou (${response.status}): ${text.slice(0, 400)}`);
    }
    return payload;
  }

  return {
    createCharge: (body) => request<StoneChargeResponse>('POST', '/charges', body),
    getCharge: (id) => request<StoneChargeResponse>('GET', `/charges/${encodeURIComponent(id)}`),
    captureCharge: (id, amount) =>
      request<StoneChargeResponse>('POST', `/charges/${encodeURIComponent(id)}/capture`, { amount }),
    cancelCharge: (id) =>
      request<StoneChargeResponse>('POST', `/charges/${encodeURIComponent(id)}/cancel`, {}),
  };
}
