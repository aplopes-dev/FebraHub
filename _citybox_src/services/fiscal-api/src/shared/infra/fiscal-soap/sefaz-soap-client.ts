import { Logger } from '@nestjs/common';
import { request as httpsRequest } from 'https';
import { SefazUnavailableError } from './errors/sefaz-unavailable.error';
import { SefazCaBundleNotFoundError } from './errors/sefaz-ca-bundle-not-found.error';
import { loadFiscalTrustStore } from './sefaz-ca-bundle';
import { extractWrappedElementXml } from './nfe-soap-response';
import { withRetry } from './soap-retry';

const logger = new Logger('SefazSoapClient');

export type SefazSoapCallInput = {
  /// Caminho local do WSDL (autoral, best-effort — ver cabeçalho dos
  /// arquivos em `resources/wsdl/nfe/`). `node-soap` também aceita URL, mas
  /// o v1 não depende de buscar o WSDL ao vivo (ver AGENTS.md).
  wsdlPath: string;
  endpoint: string;
  /// Nome da operação SOAP conforme declarada no WSDL (ex.:
  /// "nfeAutorizacaoLote", "nfeConsultaNF") — o cliente invoca
  /// `client[\`${operation}Async\`]`.
  operation: string;
  /// Nome (local) e namespace do elemento wrapper de request (ex.:
  /// "nfeDadosMsg", ".../wsdl/NFeAutorizacao4") — usado para montar o
  /// envelope manualmente via `{ _xml }` do `node-soap`, contornando
  /// qualquer serialização automática que escaparia o XML bruto embutido.
  requestElementName: string;
  requestNamespace: string;
  /// XML de negócio já pronto (ex.: `<enviNFe>...</enviNFe>` assinado) a
  /// embutir dentro do elemento wrapper acima.
  requestBodyXml: string;
  /// Nome (local) do elemento wrapper de resposta a extrair (sempre
  /// "nfeResultMsg" nos webservices NFe4 padrão nacional).
  responseWrapperLocalName: string;
  privateKeyPem: string;
  certificatePem: string;
  timeoutMs?: number;
  maxRetries?: number;
};

export type SefazSoapCallResult = {
  /// XML de negócio da resposta, já desembrulhado (ex.: `<retEnviNFe>...`).
  responseBodyXml: string;
  /// Envelope SOAP completo enviado/recebido — para auditoria (FR-011).
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

/// Erros de rede/TLS/timeout são retryable; qualquer outra coisa (ex.: bug de
/// programação, operação SOAP inexistente) não deve ser retentada — retentar
/// só ajuda para falhas transitórias de comunicação.
/// Executa o POST HTTPS com TLS mútuo. A cadeia ICP-Brasil vai em `ca`: o
/// bundle padrão do Node é a lista da Mozilla, que não inclui a raiz
/// brasileira, e sem ela o handshake falha com
/// `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` antes mesmo de o certificado do
/// Emitente ser apresentado. Escopado a esta chamada de propósito —
/// `NODE_EXTRA_CA_CERTS` alargaria o trust store do processo inteiro, que
/// também fala com MinIO e Keycloak.
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
          // A SEFAZ responde 200 mesmo para rejeição de negócio (o motivo vem
          // no `cStat` do corpo). Qualquer status diferente é falha de
          // transporte, e o corpo costuma trazer a explicação.
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

/// Executa uma chamada SOAP contra um webservice da SEFAZ com TLS mútuo (o
/// certificado A1 do Emitente), timeout e retry com backoff exponencial em
/// falhas transitórias de comunicação (T039). Não interpreta o conteúdo de
/// negócio da resposta — devolve o XML já desembrulhado para o chamador
/// (`modules/providers/sefaz-ba`) decidir o parse específico da operação.
export async function callSefazSoapOperation(
  input: SefazSoapCallInput,
): Promise<SefazSoapCallResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return withRetry(
    async () => {
      // POST HTTPS direto, sem `node-soap`. Verificado contra a SEFAZ-BA de
      // homologação em 2026-08-06: o envelope montado aqui é processado
      // (`cStat 104 — Lote processado`, com protocolo e `digVal` da assinatura
      // validados), enquanto a mesma requisição via `node-soap` falhava.
      //
      // Além de funcionar, isto elimina a dependência dos WSDLs de autoria
      // própria em `resources/wsdl/nfe/` — que o AGENTS.md já sinalizava como
      // não verificados contra o WSDL oficial. Os webservices da NF-e usam
      // sempre o mesmo par `nfeDadosMsg`/`nfeResultMsg`, então o WSDL não
      // acrescentava nada além de uma fonte de erro.
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
    // Achado 2026-08-14: `SefazCaBundleNotFoundError` (bundle ICP-Brasil
    // ausente) é erro de CONFIGURAÇÃO LOCAL — nunca chega a existir conexão
    // com a SEFAZ. Embrulhar em `SefazUnavailableError` (503, "não foi
    // possível comunicar com o órgão") fazia o `SefazBaStatusProbe` reportar
    // `UNREACHABLE` (órgão fora do ar) quando na verdade era um arquivo
    // faltando no próprio deploy — indistinguível de uma queda real da SEFAZ
    // no diagnóstico. Deixa passar sem embrulhar; quem chama decide (ver
    // `sefaz-ba-status.probe.ts`).
    if (error instanceof SefazCaBundleNotFoundError) throw error;

    // Qualquer outra falha aqui (transitória esgotada, ou não-transitória —
    // ex.: operação inexistente, resposta ininteligível) vira uma única
    // classe: não há um resultado de negócio válido para retornar em nenhum
    // caso.
    throw new SefazUnavailableError(
      'callSefazSoapOperation',
      input.operation,
      error,
    );
  });
}
