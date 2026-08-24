import type { ProviderCredentials } from '../payment-provider.interface.js';
import {
  resolveInfinitePayHandle,
  type InfinitePayCreateLinkRequest,
  type InfinitePayCreateLinkResponse,
  type InfinitePayPaymentCheckRequest,
  type InfinitePayPaymentCheckResponse,
} from './infinitepay.types.js';

export type InfinitePayClient = {
  createLink(body: InfinitePayCreateLinkRequest): Promise<InfinitePayCreateLinkResponse>;
  paymentCheck(body: InfinitePayPaymentCheckRequest): Promise<InfinitePayPaymentCheckResponse>;
};

function baseUrl(): string {
  return (
    process.env.INFINITEPAY_API_BASE_URL?.trim() ?? 'https://api.checkout.infinitepay.io'
  ).replace(/\/$/, '');
}

export function createInfinitePayClient(credentials: ProviderCredentials): InfinitePayClient {
  const handle = resolveInfinitePayHandle(credentials);

  async function request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as T) : ({} as T);
    if (!response.ok) {
      throw new Error(
        `InfinitePay ${path} falhou (${response.status}): ${text.slice(0, 300)}`,
      );
    }
    return payload;
  }

  return {
    createLink: (body) =>
      request<InfinitePayCreateLinkResponse>('/links', {
        ...body,
        handle: body.handle || handle,
      }),
    paymentCheck: (body) =>
      request<InfinitePayPaymentCheckResponse>('/payment_check', {
        ...body,
        handle: body.handle || handle,
      }),
  };
}
