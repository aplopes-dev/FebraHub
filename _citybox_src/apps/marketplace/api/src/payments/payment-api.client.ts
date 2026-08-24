import {
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  CreatePaymentChargeInput,
  PaymentApiRequestOptions,
  PaymentChargeResponse,
} from './payment-api.types.js';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3106/api';
const DEFAULT_TIMEOUT_MS = 15_000;

@Injectable()
export class PaymentApiClient {
  isConfigured(): boolean {
    return Boolean(process.env.PAYMENT_API_KEY?.trim());
  }

  baseUrl(): string {
    const raw = process.env.PAYMENT_API_BASE_URL?.trim();
    return (raw ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  async createCharge(
    input: CreatePaymentChargeInput,
    options: PaymentApiRequestOptions,
  ): Promise<PaymentChargeResponse> {
    const apiKey = process.env.PAYMENT_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Integração payment-api indisponível: configure PAYMENT_API_KEY',
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'Idempotency-Key': options.idempotencyKey,
    };
    if (options.correlationId?.trim()) {
      headers['X-Correlation-Id'] = options.correlationId.trim();
    }

    const timeoutMs = Number(process.env.PAYMENT_API_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    const res = await fetch(`${this.baseUrl()}/charges`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const body = await readJsonBody(res);
    if (!res.ok) {
      throw mapPaymentApiError(res.status, body);
    }

    return body as PaymentChargeResponse;
  }
}

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function mapPaymentApiError(status: number, body: unknown): Error {
  const message = extractMessage(body) ?? `payment-api respondeu HTTP ${status}`;
  if (status === 503 || status === 502 || status === 504) {
    return new ServiceUnavailableException(message);
  }
  return new UnprocessableEntityException(message);
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (Array.isArray(record.message)) {
    return record.message.filter((item) => typeof item === 'string').join('; ');
  }
  return undefined;
}
