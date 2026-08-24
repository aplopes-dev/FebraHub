import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { callSefin } from '../sefin-http-client';
import { SefinUnavailableError } from '../errors/sefin-unavailable.error';

/// Mocka `https.request` para nunca sair pela rede, mas monta a requisição de
/// verdade: o que é capturado aqui é byte-a-byte o que iria ao órgão fiscal.
/// Mesma abordagem já usada em `sefaz-soap-client.spec.ts`.
type Capture = { options: Record<string, unknown>; body: string };

const captures: Capture[] = [];
let responder: () => { statusCode: number; body: string } | Error;

jest.mock('https', () => ({
  request: (
    options: Record<string, unknown>,
    callback: (res: PassThrough & { statusCode: number }) => void,
  ) => {
    const chunks: Buffer[] = [];
    const req = new EventEmitter() as EventEmitter & {
      write: (c: Buffer) => void;
      end: () => void;
      destroy: (e?: Error) => void;
    };
    req.write = (chunk: Buffer) => void chunks.push(Buffer.from(chunk));
    req.destroy = (error?: Error) => {
      if (error) req.emit('error', error);
    };
    req.end = () => {
      captures.push({ options, body: Buffer.concat(chunks).toString('utf-8') });
      setImmediate(() => {
        const outcome = responder();
        if (outcome instanceof Error) {
          req.emit('error', outcome);
          return;
        }
        const res = new PassThrough() as PassThrough & { statusCode: number };
        res.statusCode = outcome.statusCode;
        callback(res);
        res.end(outcome.body);
      });
    };
    return req;
  },
}));

const base = {
  endpoint: 'https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse',
  method: 'POST' as const,
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
  certificatePem:
    '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
};

describe('callSefin', () => {
  beforeEach(() => {
    captures.length = 0;
    responder = () => ({
      statusCode: 200,
      body: JSON.stringify({ chaveAcesso: 'ABC', nfseXmlGZipB64: 'zzz' }),
    });
  });

  it('posts the JSON body and parses the JSON response', async () => {
    const result = await callSefin({
      ...base,
      body: { dpsXmlGZipB64: 'H4sIAAAA' },
    });

    expect(captures).toHaveLength(1);
    expect(JSON.parse(captures[0].body)).toEqual({ dpsXmlGZipB64: 'H4sIAAAA' });
    expect(captures[0].options.method).toBe('POST');
    expect(result.statusCode).toBe(200);
    expect(result.json).toMatchObject({ chaveAcesso: 'ABC' });
    // Corpo cru preservado para a trilha de auditoria (FR-011).
    expect(result.rawBody).toContain('chaveAcesso');
  });

  it('sets mutual TLS with the emitter certificate and the ICP-Brasil chain', async () => {
    await callSefin({ ...base, body: { dpsXmlGZipB64: 'x' } });

    const { options } = captures[0];
    expect(options.key).toBe(base.privateKeyPem);
    expect(options.cert).toBe(base.certificatePem);
    expect(options.rejectUnauthorized).toBe(true);
    // Trust store combinado — o servidor do Sefin Nacional usa CA publica.
    expect(Array.isArray(options.ca)).toBe(true);
    expect((options.ca as string[]).length).toBeGreaterThan(1);
  });

  it('omits the body and its headers on GET', async () => {
    await callSefin({
      ...base,
      method: 'GET',
      endpoint: `${base.endpoint}/ABC`,
    });

    expect(captures[0].body).toBe('');
    const headers = captures[0].options.headers as Record<string, unknown>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers.Accept).toBe('application/json');
  });

  it('retries a transient network failure and succeeds on the next attempt', async () => {
    let attempt = 0;
    responder = () => {
      attempt += 1;
      if (attempt === 1) {
        return Object.assign(new Error('socket hang up'), {
          code: 'ECONNRESET',
        });
      }
      return { statusCode: 200, body: '{"ok":true}' };
    };

    const result = await callSefin({ ...base, body: {}, maxRetries: 2 });

    expect(attempt).toBe(2);
    expect(result.json).toEqual({ ok: true });
  });

  /// O diagnóstico precisa carregar status e corpo — a versão anterior deste
  /// erro na SEFAZ dizia só "[object Object]" e escondia a causa.
  it('surfaces status and body when the national environment rejects the request', async () => {
    responder = () => ({ statusCode: 422, body: '{"erro":"E1226"}' });

    expect.assertions(3);
    try {
      await callSefin({ ...base, body: {}, maxRetries: 0 });
    } catch (error) {
      expect(error).toBeInstanceOf(SefinUnavailableError);
      const { internalMessage } = error as SefinUnavailableError;
      expect(internalMessage).toContain('statusCode=422');
      expect(internalMessage).toContain('E1226');
    }
  });
});

/// Verificado contra produção restrita em 2026-08-06: o Sefin devolve HTTP 400
/// COM lista de erros para rejeição de negócio (`E0310`). Tratar isso como
/// falha de comunicação viraria 503 e mandaria o operador "tentar de novo em
/// instantes" para um erro de preenchimento que nunca se resolve sozinho.
describe('callSefin — 400 de negócio vs. falha de transporte', () => {
  beforeEach(() => {
    captures.length = 0;
  });

  it('passes a 400 carrying structured errors through to the caller', async () => {
    responder = () => ({
      statusCode: 400,
      body: JSON.stringify({
        tipoAmbiente: 2,
        erros: [
          { Codigo: 'E0310', Descricao: 'Código de tributação inexistente' },
        ],
      }),
    });

    const result = await callSefin({ ...base, body: {}, maxRetries: 0 });

    expect(result.statusCode).toBe(400);
    expect(result.json).toMatchObject({
      erros: [{ Codigo: 'E0310' }],
    });
  });

  it('still fails when a 4xx carries no structured errors (proxy HTML, empty body)', async () => {
    responder = () => ({ statusCode: 404, body: '<html>Not Found</html>' });

    await expect(
      callSefin({ ...base, body: {}, maxRetries: 0 }),
    ).rejects.toBeInstanceOf(SefinUnavailableError);
  });
});
