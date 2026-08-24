import { Injectable } from '@nestjs/common';
import {
  SignaturePackageProvisioning,
  type SignaturePackageRequestDto,
} from '../../domain/providers/signature-package-provisioning.provider';
import { VerticalProvisioningError } from '../../domain/errors/vertical-provisioning.error';

const REQUEST_TIMEOUT_MS = 15_000;
const VERTICAL = 'Clínica';

type TokenCache = { value: string; expiresAtMs: number };

/**
 * Adapter HTTP machine-to-machine `admin-api → clinica-api` para pacotes de assinatura.
 *
 * Autentica com o client `admin-m2m` **do realm `citybox-clinica`** (ADR C-16 §2.1).
 * Antes autenticava no realm do próprio admin, o que a `clinica-api` passou a rejeitar
 * por `issuer`/`azp` de outro realm. Base URL: `CLINICA_API_URL`.
 */
@Injectable()
export class HttpSignaturePackageProvisioning extends SignaturePackageProvisioning {
  private token: TokenCache | null = null;

  private baseUrl(): string {
    const url = process.env.CLINICA_API_URL;
    if (!url) {
      throw new VerticalProvisioningError(
        HttpSignaturePackageProvisioning.name,
        VERTICAL,
        'CLINICA_API_URL não configurada — não é possível falar com a vertical Clínica.',
        undefined,
      );
    }
    return url.replace(/\/$/, '');
  }

  private async serviceToken(): Promise<string> {
    if (this.token && this.token.expiresAtMs > Date.now() + 30_000) {
      return this.token.value;
    }

    const issuer = process.env.KEYCLOAK_CLINICA_M2M_ISSUER?.trim();
    const clientId = process.env.KEYCLOAK_CLINICA_M2M_CLIENT_ID?.trim();
    const clientSecret = process.env.KEYCLOAK_CLINICA_M2M_CLIENT_SECRET?.trim();

    // Falha explícita e nomeada: sem isso o `fetch` iria para uma URL vazia e o erro
    // apareceria como "não foi possível falar com a vertical", escondendo a causa.
    const missing = [
      issuer ? null : 'KEYCLOAK_CLINICA_M2M_ISSUER',
      clientId ? null : 'KEYCLOAK_CLINICA_M2M_CLIENT_ID',
      clientSecret ? null : 'KEYCLOAK_CLINICA_M2M_CLIENT_SECRET',
    ].filter((name): name is string => name !== null);

    if (missing.length > 0) {
      throw new VerticalProvisioningError(
        HttpSignaturePackageProvisioning.name,
        VERTICAL,
        `Credencial M2M da vertical ${VERTICAL} não configurada: ${missing.join(', ')}.`,
        undefined,
      );
    }

    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId as string,
        client_secret: clientSecret as string,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new VerticalProvisioningError(
        HttpSignaturePackageProvisioning.name,
        VERTICAL,
        `Não foi possível autenticar no realm da vertical ${VERTICAL}.`,
        res.status,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.token = {
      value: data.access_token,
      expiresAtMs: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async call<T>(
    storeId: string,
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl()}${path}`;
    const token = await this.serviceToken();

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Store-Id': storeId,
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new VerticalProvisioningError(
        HttpSignaturePackageProvisioning.name,
        VERTICAL,
        `Não foi possível falar com a vertical ${VERTICAL}. Tente novamente.`,
        undefined,
      );
    }

    const text = await res.text();
    if (!res.ok) {
      throw new VerticalProvisioningError(
        HttpSignaturePackageProvisioning.name,
        VERTICAL,
        extractMessage(text) ??
          `A vertical ${VERTICAL} recusou a operação (${res.status}).`,
        res.status,
      );
    }

    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listRequests(storeId: string): Promise<SignaturePackageRequestDto[]> {
    const body = await this.call<{ data: SignaturePackageRequestDto[] }>(
      storeId,
      '/api/v1/signature-package-requests',
      { method: 'GET' },
    );
    return body?.data ?? [];
  }

  async liberate(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto> {
    const body = await this.call<{ data: SignaturePackageRequestDto }>(
      storeId,
      `/api/v1/signature-package-requests/${requestId}/liberar`,
      { method: 'PATCH' },
    );
    return body.data;
  }

  async cancel(
    storeId: string,
    requestId: string,
  ): Promise<SignaturePackageRequestDto> {
    const body = await this.call<{ data: SignaturePackageRequestDto }>(
      storeId,
      `/api/v1/signature-package-requests/${requestId}/cancelar`,
      { method: 'PATCH' },
    );
    return body.data;
  }
}

function extractMessage(text: string): string | null {
  try {
    const data = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof data.error === 'string') return data.error;
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
  } catch {
    // corpo não-JSON (ex.: 502 do nginx)
  }
  return null;
}
