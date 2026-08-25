import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { request as httpsRequest } from 'https';
import * as libxmljs from 'libxmljs2';
import { loadFiscalTrustStore, SefazCaBundleNaoEncontrado } from './ca-bundle';

/**
 * Cliente SOAP da SEFAZ/SVRS via HTTPS bruto + TLS mútuo. Portado de
 * @citybox/fiscal-api (sefaz-soap-client.ts). Os helpers de retry
 * (`withRetry`/`soap-retry.ts`) e de extração do wrapper de resposta
 * (`extractWrappedElementXml`/`nfe-soap-response.ts`) foram inlinados aqui.
 */

const logger = new Logger('SefazSoapClient');

// ---------------------------------------------------------------------------
// Retry genérico (inlinado de soap-retry.ts).
// ---------------------------------------------------------------------------

type RetryOptions = {
  /** Tentativas ADICIONAIS após a primeira (padrão 2 → até 3 no total). */
  maxRetries?: number;
  baseDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
  /** Injetável em teste para não esperar o backoff real. */
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial (500ms, 1s, 2s, ...). `isRetryable` decide; o
 * cliente SOAP só marca como retryable falhas de comunicação, nunca uma resposta
 * SOAP bem-formada com rejeição.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const isRetryable = options.isRetryable ?? (() => true);
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  // Inalcançável (o loop sempre retorna ou lança), mas satisfaz o compilador.
  throw lastError;
}

// ---------------------------------------------------------------------------
// Extração do payload de negócio do envelope SOAP (inlinado de
// nfe-soap-response.ts).
// ---------------------------------------------------------------------------

/**
 * Extrai o XML bruto embutido dentro de um elemento wrapper genérico (ex.:
 * `nfeResultMsg`) de uma resposta SOAP — os webservices da SEFAZ sempre
 * embrulham o payload de negócio real (`retEnviNFe`, `retConsSitNFe`, ...) dentro
 * de um elemento sem schema forte, então extraímos via XPath por nome local.
 */
export function extractWrappedElementXml(
  rawSoapResponseXml: string,
  wrapperLocalName: string,
): string | null {
  const doc = libxmljs.parseXml(rawSoapResponseXml);
  const [wrapper] = doc.find(`//*[local-name()="${wrapperLocalName}"]`);
  if (!wrapper) return null;

  const [innerElement] = wrapper.childNodes();
  return innerElement ? innerElement.toString() : null;
}

// ---------------------------------------------------------------------------
// Cliente SOAP.
// ---------------------------------------------------------------------------

/** Falha de comunicação com a SEFAZ (rede/TLS/timeout, ou resposta ininteligível). */
export class SefazIndisponivel extends ServiceUnavailableException {
  constructor(context: string, operation: string, cause?: unknown) {
    super(
      `Não foi possível comunicar com a SEFAZ na operação "${operation}" (${context}).`,
    );
    this.name = 'SefazIndisponivel';
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export type SefazSoapCallInput = {
  /**
   * Caminho local do WSDL (best-effort). O v1 não depende de buscar o WSDL ao
   * vivo — o envelope é montado manualmente abaixo.
   */
  wsdlPath: string;
  endpoint: string;
  /** Nome da operação SOAP conforme declarada no WSDL. */
  operation: string;
  /**
   * Nome (local) e namespace do elemento wrapper de request (ex.: "nfeDadosMsg",
   * ".../wsdl/NFeAutorizacao4") — usado para montar o envelope manualmente,
   * contornando qualquer serialização automática que escaparia o XML embutido.
   */
  requestElementName: string;
  requestNamespace: string;
  /** XML de negócio já pronto (ex.: `<enviNFe>...</enviNFe>` assinado). */
  requestBodyXml: string;
  /** Nome (local) do elemento wrapper de resposta (sempre "nfeResultMsg"). */
  responseWrapperLocalName: string;
  privateKeyPem: string;
  certificatePem: string;
  timeoutMs?: number;
  maxRetries?: number;
};

export type SefazSoapCallResult = {
  /** XML de negócio da resposta, já desembrulhado (ex.: `<retEnviNFe>...`). */
  responseBodyXml: string;
  /** Envelope SOAP completo enviado/recebido — para auditoria. */
  rawRequestXml: string | null;
  rawResponseXml: string | null;
};

const DEFAULT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tempo limite de ${timeoutMs}ms excedido`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Executa o POST HTTPS com TLS mútuo. A cadeia ICP-Brasil vai em `ca`: o bundle
 * padrão do Node é a lista da Mozilla, que não inclui a raiz brasileira, e sem
 * ela o handshake falha com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Escopado a esta
 * chamada de propósito — `NODE_EXTRA_CA_CERTS` alargaria o trust store do
 * processo inteiro.
 */
function postSoapEnvelope(input: {
  endpoint: string;
  envelope: string;
  privateKeyPem: string;
  certificatePem: string;
  timeoutMs: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(input.endpoint);
    const body = Buffer.from(input.envelope, 'utf-8');

    const req = httpsRequest(
      {
        host: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        key: input.privateKeyPem,
        cert: input.certificatePem,
        ca: loadFiscalTrustStore(),
        rejectUnauthorized: true,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'Content-Length': body.byteLength,
        },
        timeout: input.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8');
          // A SEFAZ responde 200 mesmo para rejeição de negócio (o motivo vem no
          // `cStat` do corpo). Qualquer status diferente é falha de transporte.
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              Object.assign(new Error(`HTTP ${res.statusCode} da SEFAZ`), {
                statusCode: res.statusCode,
                body: text.slice(0, 2000),
              }),
            );
            return;
          }
          resolve(text);
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Tempo limite de ${input.timeoutMs}ms excedido`));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Erros de rede/TLS/timeout são retryable; qualquer outra coisa (ex.: bug de
 * programação, operação SOAP inexistente) não deve ser retentada.
 */
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

/**
 * Executa uma chamada SOAP contra um webservice da SEFAZ com TLS mútuo (o
 * certificado A1 do Emitente), timeout e retry com backoff exponencial em falhas
 * transitórias. Não interpreta o conteúdo de negócio — devolve o XML já
 * desembrulhado para o chamador decidir o parse da operação.
 */
export async function callSefazSoapOperation(
  input: SefazSoapCallInput,
): Promise<SefazSoapCallResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return withRetry(
    async () => {
      // POST HTTPS direto, sem `node-soap`. Os webservices da NF-e usam sempre o
      // mesmo par `nfeDadosMsg`/`nfeResultMsg`, então o WSDL não acrescenta nada
      // além de uma fonte de erro.
      const envelope =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">' +
        '<soap:Body>' +
        `<${input.requestElementName} xmlns="${input.requestNamespace}">` +
        input.requestBodyXml +
        `</${input.requestElementName}>` +
        '</soap:Body></soap:Envelope>';

      logger.log(`→ ${input.operation} (${input.endpoint})`);

      const rawResponseXml = await withTimeout(
        postSoapEnvelope({
          endpoint: input.endpoint,
          envelope,
          privateKeyPem: input.privateKeyPem,
          certificatePem: input.certificatePem,
          timeoutMs,
        }),
        timeoutMs,
      );

      const rawRequestXml = envelope;

      const responseBodyXml = rawResponseXml
        ? extractWrappedElementXml(
            rawResponseXml,
            input.responseWrapperLocalName,
          )
        : null;

      if (!responseBodyXml) {
        throw new Error(
          `Resposta SOAP sem elemento "${input.responseWrapperLocalName}" reconhecível`,
        );
      }

      logger.log(`← ${input.operation}: ${responseBodyXml.length} bytes`);
      return { responseBodyXml, rawRequestXml, rawResponseXml };
    },
    {
      maxRetries: input.maxRetries,
      isRetryable: isTransientError,
    },
  ).catch((error: unknown) => {
    // `SefazCaBundleNaoEncontrado` (bundle ICP-Brasil ausente) é erro de
    // CONFIGURAÇÃO LOCAL — nunca chega a existir conexão com a SEFAZ. Não
    // embrulhar em `SefazIndisponivel` (503); deixa passar para quem chama
    // distinguir "arquivo faltando no deploy" de "órgão fora do ar".
    if (error instanceof SefazCaBundleNaoEncontrado) throw error;

    // Qualquer outra falha aqui (transitória esgotada, ou não-transitória) vira
    // uma única classe: não há um resultado de negócio válido para retornar.
    throw new SefazIndisponivel(
      'callSefazSoapOperation',
      input.operation,
      error,
    );
  });
}
