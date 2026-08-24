import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  FiscalApiProvider,
  type FiscalCompany,
  type FiscalDocumentsPage,
  type FiscalDocumentsSummary,
  type ListFiscalDocumentsQuery,
} from '../domain/providers/fiscal-api.provider';

const REQUEST_TIMEOUT_MS = 15_000;

type TokenCache = { value: string; expiresAtMs: number };

/**
 * Cliente M2M da `services/fiscal-api` (ADR C-16).
 *
 * ## Por que a chamada passa por aqui, e não pelo browser
 *
 * Até esta mudança o `erp-web` chamava a `fiscal-api` direto, por um proxy, com
 * o token do **usuário final** — e o `X-Company-Id` era escolhido no front. A
 * `fiscal-api` tentava validar esse vínculo consultando `platform.members`, do
 * `admin-api`; com um realm por sistema essa cadeia deixou de existir, porque a
 * identidade do lojista passou a ser do ERP (`erp.users.keycloak_sub`).
 *
 * A responsabilidade veio para cá, que é onde o dado existe: a `erp-api` resolve
 * o Emitente **a partir da organização ativa do tenant**, nunca de um id que o
 * cliente mandou. O front não escolhe mais de quem são os documentos fiscais.
 *
 * A `fiscal-api` confia neste chamador pelo `azp=fiscal-m2m`
 * (`TrustedSystemCompanyAccessPolicy`) — ela não tem segunda barreira. Toda
 * rota nova aqui precisa resolver o Emitente pelo tenant antes de chamar.
 */
@Injectable()
export class HttpFiscalApiAdapter extends FiscalApiProvider {
  private token: TokenCache | null = null;

  private baseUrl(): string {
    const url = process.env.FISCAL_API_URL?.trim();
    if (!url) {
      throw new ServiceUnavailableException(
        'FISCAL_API_URL não configurada — não é possível falar com a fiscal-api.',
      );
    }
    // Aceita `http://host:3116` ou `http://host:3116/api`; o adapter prefixa `/api/v1`.
    return url.replace(/\/$/, '').replace(/\/api$/i, '');
  }

  private async serviceToken(): Promise<string> {
    if (this.token && this.token.expiresAtMs > Date.now() + 30_000) {
      return this.token.value;
    }

    const issuer = process.env.KEYCLOAK_ISSUER?.trim();
    const clientId = process.env.KEYCLOAK_FISCAL_M2M_CLIENT_ID?.trim();
    const clientSecret = process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET?.trim();

    const missing = [
      issuer ? null : 'KEYCLOAK_ISSUER',
      clientId ? null : 'KEYCLOAK_FISCAL_M2M_CLIENT_ID',
      clientSecret ? null : 'KEYCLOAK_FISCAL_M2M_CLIENT_SECRET',
    ].filter((name): name is string => name !== null);

    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `Credencial M2M da fiscal-api não configurada: ${missing.join(', ')}.`,
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
      throw new ServiceUnavailableException(
        'Não foi possível autenticar para falar com a fiscal-api.',
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
    path: string,
    companyId: string | null,
  ): Promise<T | null> {
    const token = await this.serviceToken();

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl()}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(companyId ? { 'X-Company-Id': companyId } : {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      // Fiscal fora do ar vira erro claro na tela, não lista vazia — uma lista
      // vazia diria ao lojista que ele não tem notas, o que é diferente.
      throw new ServiceUnavailableException(
        'Não foi possível falar com o serviço fiscal. Tente novamente.',
      );
    }

    if (res.status === 404) return null;

    const text = await res.text();
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `O serviço fiscal recusou a operação (${res.status}).`,
      );
    }

    return (text ? JSON.parse(text) : null) as T | null;
  }

  async findCompanyByCnpj(cnpj: string): Promise<FiscalCompany | null> {
    const body = await this.call<{ data?: FiscalCompany[] }>(
      `/api/v1/companies?cnpj=${encodeURIComponent(cnpj)}`,
      null,
    );
    return body?.data?.[0] ?? null;
  }

  async listDocuments(
    query: ListFiscalDocumentsQuery,
  ): Promise<FiscalDocumentsPage> {
    const params = new URLSearchParams();
    // spec erp/030: `GET /v1/fiscal-documents` exige `companyId` como query
    // param (`@Query('companyId')`, 400 sem ele) — o header `X-Company-Id`
    // sozinho (abaixo, em `call()`) nunca bastou para esta rota.
    params.set('companyId', query.companyId);
    if (query.page) params.set('page', String(query.page));
    if (query.perPage) params.set('perPage', String(query.perPage));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.model) params.set('model', query.model);
    if (query.issuedFrom) params.set('issuedFrom', query.issuedFrom);
    if (query.issuedTo) params.set('issuedTo', query.issuedTo);

    const body = await this.call<FiscalDocumentsPage>(
      `/api/v1/fiscal-documents?${params}`,
      query.companyId,
    );
    return (
      body ?? {
        data: [],
        meta: { total: 0, page: 1, perPage: 20, totalPages: 0 },
      }
    );
  }

  async getSummary(companyId: string): Promise<FiscalDocumentsSummary> {
    const params = new URLSearchParams({ companyId });
    const body = await this.call<FiscalDocumentsSummary>(
      `/api/v1/fiscal-documents/summary?${params}`,
      companyId,
    );
    return body ?? { data: { total: 0, authorized: 0, cancelled: 0 } };
  }
}
