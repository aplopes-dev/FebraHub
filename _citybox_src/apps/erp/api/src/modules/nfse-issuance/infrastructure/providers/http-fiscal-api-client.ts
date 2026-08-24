import { Injectable, Logger } from '@nestjs/common';
import {
  FiscalApiClient,
  type IssueNfseRequest,
  type IssueNfseResult,
  type ResolvedFiscalCompany,
} from '../../domain/providers/fiscal-api-client.interface';
import { FiscalApiEmissionError } from '../../domain/errors/fiscal-api-emission.error';
import { getFiscalServiceAccessToken } from './fiscal-service-token';

const DEFAULT_FISCAL_API_URL = 'http://127.0.0.1:3116/api';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Tradução dos códigos do órgão fiscal em mensagem de negócio (spec erp/018). A
 * fiscal-api devolve `error.code` (ex.: `E0116`) + `error.message`; a tela nunca
 * mostra o código cru. Códigos fora da tabela caem na mensagem do órgão.
 */
const ORG_ERROR_MESSAGES: Record<string, string> = {
  E0116:
    'A Inscrição Municipal da empresa não está registrada no CNC do município. Regularize junto à prefeitura antes de emitir.',
  E0310:
    'O código de tributação nacional (cTribNac) do serviço está ausente ou é inválido. Revise o Grupo de ISSQN.',
  E0625:
    'A alíquota do ISS só pode ser enviada quando há retenção. Sem retenção, quem define a alíquota é o município.',
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
 * uma variável configurada sem o sufixo derrubava toda emissão de NF-e/NFS-e
 * em produção com 404 silencioso, disfarçado de "Emitente não encontrado"
 * (ver `AGENTS.md`, incidente 2026-08-15). Em vez de deixar o boot passar com
 * um valor quebrado, corrige e avisa — a alternativa (falhar o boot) tiraria
 * o erp-api inteiro do ar por um problema isolado à emissão fiscal (decisão
 * do clarify da spec).
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

  /**
   * Token de serviço, resolvido ANTES de qualquer tentativa de rede — achado
   * 2026-08-14 (spec erp/025, P1): a versão anterior chamava `authToken()`
   * dentro do `try` do `fetch`, então uma falha de autenticação/configuração
   * (token ausente, Keycloak fora do ar) caía no mesmo `catch` genérico da
   * falha de transporte e virava a mesma mensagem vaga — a causa real nunca
   * aparecia nem no log. Separado aqui: falha de auth loga com o prefixo
   * `[FiscalAuth]`, nunca se confunde com `[FiscalTransport]` (fetch) ou
   * `[FiscalBusiness]` (recusa da fiscal-api).
   */
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
      // Fallback conservador: se a fiscal-api não devolver o campo por algum
      // motivo, HOMOLOGATION é o único ambiente que esta plataforma sustenta
      // hoje — nunca assumir PRODUCTION por omissão.
      defaultEnvironment: isFiscalEnvironment(company.defaultEnvironment)
        ? company.defaultEnvironment
        : 'HOMOLOGATION',
    };
  }

  async issueNfse(request: IssueNfseRequest): Promise<IssueNfseResult> {
    const token = await this.resolveToken();

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}/v1/nfse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      // Mensagem genérica ao usuário — o `error.message` do fetch pode conter
      // host/porta internos (ex.: ECONNREFUSED 127.0.0.1:3116); o log interno
      // pode, porque não sai da erp-api.
      this.logger.error(
        `[FiscalTransport] Falha de transporte ao emitir NFS-e: ${String(error)}`,
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
      // Corpo não-JSON — cai no fallback abaixo, mas registra para diagnóstico
      // (uma fiscal-api respondendo erro fora do contrato esperado merece rastro).
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
