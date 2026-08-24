import { Injectable, Logger } from '@nestjs/common';
import {
  FiscalApiClient,
  type IssueNfeRequest,
  type IssueNfeResult,
  type ResolvedFiscalCompany,
} from '../../domain/providers/fiscal-api-client.interface';
import { FiscalApiEmissionError } from '../../domain/errors/fiscal-api-emission.error';
// Reuso do token M2M já implementado em `nfse-issuance` (spec 025, P1) — caminho
// relativo dentro da mesma erp-api, não um pacote compartilhado entre sistemas
// (ADR C-17 proíbe o segundo, não o primeiro; plan.md desta spec §Structure
// Decision). O client HTTP em si é próprio (endpoint/payload de NF-e são
// diferentes de NFS-e) — só a lógica de obter/cachear o token é reusada.
import { getFiscalServiceAccessToken } from '../../../nfse-issuance/infrastructure/providers/fiscal-service-token';

const DEFAULT_FISCAL_API_URL = 'http://127.0.0.1:3116/api';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Tradução dos códigos do órgão fiscal em mensagem de negócio (molde
 * `nfse-issuance`). Códigos fora da tabela caem na mensagem do órgão.
 */
const ORG_ERROR_MESSAGES: Record<string, string> = {
  E0116:
    'A Inscrição Municipal da empresa não está registrada no CNC do município. Regularize junto à prefeitura antes de emitir.',
};

type FiscalApiSuccessBody = {
  data?: {
    status?: string;
    accessKey?: string | null;
    protocol?: string | null;
    // spec erp/028 — a fiscal-api já devolve os dois no corpo de sucesso
    // (mesmo presenter de `GET /v1/fiscal-documents`); antes eram lidos e
    // descartados aqui.
    errorCode?: string | null;
    errorMessage?: string | null;
    // spec erp/029 — idem, necessário para montar a URL de download.
    documentId?: string | null;
  };
};

type FiscalApiErrorBody = {
  error?: { code?: string; message?: string } | string;
  message?: string;
};

type FiscalApiCompanyBody = {
  data?:
    | Array<{ id?: string; defaultEnvironment?: string }>
    | { id?: string; defaultEnvironment?: string }
    | null;
};

const FISCAL_ENVIRONMENTS = ['HOMOLOGATION', 'PRODUCTION'] as const;
type FiscalEnvironment = (typeof FISCAL_ENVIRONMENTS)[number];

function isFiscalEnvironment(value: unknown): value is FiscalEnvironment {
  return (
    typeof value === 'string' &&
    (FISCAL_ENVIRONMENTS as readonly string[]).includes(value)
  );
}

/**
 * Normaliza `FISCAL_API_URL` para sempre terminar em `/api` (spec erp/027) —
 * mesmo hardening de `nfse-issuance/infrastructure/providers/http-fiscal-api-client.ts`
 * (arquivo irmão, duplicado de propósito — ver plan.md D2 desta spec). Uma
 * variável sem o sufixo derrubava toda emissão em produção com 404 silencioso.
 */
function normalizeFiscalApiUrl(
  raw: string | undefined,
  logger: Logger,
): string {
  const value = raw ?? DEFAULT_FISCAL_API_URL;
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    logger.warn(
      `[FiscalConfig] FISCAL_API_URL vazia ou inválida ("${value}") — usando o default "${DEFAULT_FISCAL_API_URL}".`,
    );
    return DEFAULT_FISCAL_API_URL;
  }
  if (trimmed.endsWith('/api')) return trimmed;
  logger.warn(
    `[FiscalConfig] FISCAL_API_URL="${value}" não termina em "/api" — normalizando para "${trimmed}/api". Corrija a variável de ambiente.`,
  );
  return `${trimmed}/api`;
}

@Injectable()
export class HttpFiscalApiClient extends FiscalApiClient {
  private readonly logger = new Logger(HttpFiscalApiClient.name);

  private baseUrl(): string {
    return normalizeFiscalApiUrl(process.env.FISCAL_API_URL, this.logger);
  }

  /** Mesmo padrão de `nfse-issuance` (spec erp/025, P1): resolvido ANTES de
   * qualquer tentativa de rede, com log/mensagem próprios (`[FiscalAuth]`),
   * pra não confundir uma falha de auth com uma falha de transporte. */
  private async resolveToken(): Promise<string> {
    try {
      return await getFiscalServiceAccessToken();
    } catch (error: unknown) {
      this.logger.error(
        `[FiscalAuth] Falha ao obter token de serviço para a fiscal-api: ${String(error)}`,
      );
      throw new FiscalApiEmissionError(
        'Serviço fiscal indisponível (autenticação). Tente novamente em instantes.',
      );
    }
  }

  async findCompanyIdByCnpj(
    cnpj: string,
  ): Promise<ResolvedFiscalCompany | null> {
    const digits = cnpj.replace(/\D/g, '');
    const token = await this.resolveToken();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}/v1/companies?cnpj=${digits}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      this.logger.error(
        `[FiscalTransport] Falha de transporte ao buscar Emitente por CNPJ: ${String(error)}`,
      );
      throw new FiscalApiEmissionError(
        'Não foi possível contatar o serviço fiscal. Tente novamente.',
      );
    }
    if (!response.ok) {
      this.logger.error(
        `[FiscalBusiness] Busca de Emitente por CNPJ recusada (HTTP ${response.status})`,
      );
      throw new FiscalApiEmissionError(
        'Não foi possível resolver o Emitente fiscal da organização.',
      );
    }
    const body = (await response.json()) as FiscalApiCompanyBody;
    const data = body.data;
    const company = Array.isArray(data) ? data[0] : data;
    if (!company?.id) return null;
    return {
      id: company.id,
      defaultEnvironment: isFiscalEnvironment(company.defaultEnvironment)
        ? company.defaultEnvironment
        : 'HOMOLOGATION',
    };
  }

  async issueNfe(request: IssueNfeRequest): Promise<IssueNfeResult> {
    const token = await this.resolveToken();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}/v1/nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      this.logger.error(
        `[FiscalTransport] Falha de transporte ao emitir NF-e: ${String(error)}`,
      );
      throw new FiscalApiEmissionError(
        'Não foi possível contatar o serviço fiscal. Tente novamente.',
      );
    }

    if (!response.ok) {
      throw await this.toEmissionError(response);
    }

    const body = (await response.json()) as FiscalApiSuccessBody;
    const data = body.data ?? {};
    if (!data.status) {
      this.logger.error(
        '[FiscalBusiness] Resposta de emissão sem status do documento',
      );
      throw new FiscalApiEmissionError(
        'O serviço fiscal respondeu sem o status do documento.',
      );
    }
    return {
      status: data.status,
      accessKey: data.accessKey ?? null,
      protocol: data.protocol ?? null,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
      documentId: data.documentId ?? null,
    };
  }

  private async toEmissionError(
    response: Response,
  ): Promise<FiscalApiEmissionError> {
    let body: FiscalApiErrorBody = {};
    try {
      body = (await response.json()) as FiscalApiErrorBody;
    } catch (error: unknown) {
      this.logger.warn(
        `[FiscalBusiness] Corpo de erro não-JSON (HTTP ${response.status}): ${String(error)}`,
      );
    }
    const code = typeof body.error === 'object' ? body.error?.code : undefined;
    const orgMessage =
      typeof body.error === 'object'
        ? body.error?.message
        : typeof body.error === 'string'
          ? body.error
          : body.message;

    this.logger.error(
      `[FiscalBusiness] Emissão recusada (HTTP ${response.status}${code ? `, código ${code}` : ''}): ${orgMessage ?? '(sem mensagem)'}`,
    );

    if (code && ORG_ERROR_MESSAGES[code]) {
      return new FiscalApiEmissionError(ORG_ERROR_MESSAGES[code], code);
    }
    return new FiscalApiEmissionError(
      orgMessage ??
        `O serviço fiscal recusou a emissão (HTTP ${response.status}).`,
      code,
    );
  }
}
