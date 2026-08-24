import { Logger } from '@nestjs/common';
import { request as httpsRequest } from 'https';
import { loadFiscalTrustStore } from '../fiscal-soap/sefaz-ca-bundle';
import { SefazCaBundleNotFoundError } from '../fiscal-soap/errors/sefaz-ca-bundle-not-found.error';
import { withRetry } from '../fiscal-soap/soap-retry';
import { SefinUnavailableError } from './errors/sefin-unavailable.error';

const logger = new Logger('SefinHttpClient');
const DEFAULT_TIMEOUT_MS = 30_000;

export type SefinRequestInput = {
  endpoint: string;
  method: 'GET' | 'POST';
  /// Corpo JSON já montado. Ausente em GET.
  body?: unknown;
  privateKeyPem: string;
  certificatePem: string;
  timeoutMs?: number;
  maxRetries?: number;
};

export type SefinResponse = {
  statusCode: number;
  /// Corpo cru — o chamador decide o parse. Guardado também para a trilha de
  /// auditoria (FR-011).
  rawBody: string;
  /// Corpo já parseado quando é JSON válido; `null` caso contrário.
  json: unknown;
};

/// Cliente HTTP do Sistema Nacional da NFS-e.
///
/// Espelha `postSoapEnvelope` de `fiscal-soap/sefaz-soap-client.ts`, que foi
/// verificado contra órgão fiscal real (SEFAZ-BA, 2026-08-06). A escolha por
/// `https.request` em vez de biblioteca de terceiros é deliberada: a
/// substituição do `node-soap` por POST direto foi exatamente o que destravou
/// a transmissão de NF-e.
///
/// A cadeia ICP-Brasil vai em `ca` — o bundle padrão do Node é a lista da
/// Mozilla, que não inclui a raiz brasileira. Escopado a esta chamada: o
/// processo também fala com MinIO e Keycloak, e alargar o trust store global
/// seria conceder confiança onde ela não é necessária.
export async function callSefin(
  input: SefinRequestInput,
): Promise<SefinResponse> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return withRetry(() => performRequest(input, timeoutMs), {
    maxRetries: input.maxRetries,
    isRetryable: isTransientError,
  }).catch((error: unknown) => {
    // Ver o mesmo achado em `sefaz-soap-client.ts` (2026-08-14): bundle de CA
    // ausente é config local, não indisponibilidade do Sefin — não embrulhar.
    if (error instanceof SefazCaBundleNotFoundError) throw error;
    throw new SefinUnavailableError('callSefin', input.endpoint, error);
  });
}

function performRequest(
  input: SefinRequestInput,
  timeoutMs: number,
): Promise<SefinResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(input.endpoint);
    const payload =
      input.body === undefined
        ? undefined
        : Buffer.from(JSON.stringify(input.body), 'utf-8');

    logger.log(`→ ${input.method} ${url.pathname}`);

    const req = httpsRequest(
      {
        host: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method: input.method,
        key: input.privateKeyPem,
        cert: input.certificatePem,
        ca: loadFiscalTrustStore(),
        rejectUnauthorized: true,
        headers: {
          Accept: 'application/json',
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': payload.byteLength,
              }
            : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          const statusCode = res.statusCode ?? 0;
          logger.log(`← ${input.method} ${url.pathname}: ${statusCode}`);

          const json = parseJsonOrNull(rawBody);

          // O Sefin devolve **HTTP 400 com corpo de erros** para rejeição de
          // negócio — verificado em 2026-08-06 contra produção restrita
          // (`E0310`, código de tributação inexistente). Tratar isso como
          // falha de comunicação viraria 503 e mandaria o operador "tentar de
          // novo em instantes" para um erro de preenchimento que nunca vai se
          // resolver sozinho. Rejeição estruturada passa adiante; o provider
          // interpreta e o mapa de códigos oficiais dá a orientação.
          if (statusCode >= 400 && !hasStructuredErrors(json)) {
            reject(
              Object.assign(new Error(`HTTP ${statusCode} do Sefin Nacional`), {
                statusCode,
                body: rawBody.slice(0, 2000),
              }),
            );
            return;
          }

          resolve({ statusCode, rawBody, json });
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Tempo limite de ${timeoutMs}ms excedido`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

/// Distingue rejeicao de negocio (corpo com lista de erros do orgao fiscal) de
/// falha de transporte (HTML de proxy, corpo vazio, 5xx generico). So a
/// primeira deve chegar ao provider como resultado; a segunda e comunicacao.
function hasStructuredErrors(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false;
  const body = json as Record<string, unknown>;
  const list = body.erros ?? body.Erros ?? body.errors;
  return Array.isArray(list) && list.length > 0;
}

function parseJsonOrNull(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Error && error.message.includes('Tempo limite')) {
    return true;
  }
  const code = (error as { code?: string } | null | undefined)?.code;
  return (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN'
  );
}
