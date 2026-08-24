import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { callSefazSoapOperation } from '../sefaz-soap-client';
import { SefazUnavailableError } from '../errors/sefaz-unavailable.error';

/// O transporte é POST HTTPS direto (sem `node-soap`) — verificado contra a
/// SEFAZ-BA de homologação em 2026-08-06, onde o `node-soap` falhava e o POST
/// direto era processado (`cStat 104 — Lote processado`).
///
/// Estes testes mockam `https.request` para nunca sair pela rede, mas montam o
/// envelope de verdade: o corpo capturado aqui é byte-a-byte o que iria para o
/// órgão fiscal.
type Capture = {
  options: Record<string, unknown>;
  body: string;
};

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

    req.write = (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    };
    req.destroy = (error?: Error) => {
      if (error) req.emit('error', error);
    };
    req.end = () => {
      captures.push({
        options,
        body: Buffer.concat(chunks).toString('utf-8'),
      });

      // `setImmediate` reproduz a assincronia do socket real: sem isso o
      // callback correria antes de o chamador registrar seus listeners.
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

const SOAP_OK = (inner: string) =>
  '<?xml version="1.0" encoding="utf-8"?>' +
  '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body>' +
  '<nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">' +
  inner +
  '</nfeResultMsg></soap:Body></soap:Envelope>';

const baseInput = {
  wsdlPath: 'nao-usado',
  endpoint:
    'https://hnfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx',
  operation: 'nfeAutorizacaoLote',
  requestElementName: 'nfeDadosMsg',
  requestNamespace: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
  responseWrapperLocalName: 'nfeResultMsg',
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
  certificatePem:
    '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
};

describe('callSefazSoapOperation', () => {
  beforeEach(() => {
    captures.length = 0;
    responder = () => ({
      statusCode: 200,
      body: SOAP_OK(
        '<retEnviNFe versao="4.00"><cStat>104</cStat></retEnviNFe>',
      ),
    });
  });

  it('sends the raw business XML unescaped inside the request wrapper element and parses the response', async () => {
    const result = await callSefazSoapOperation({
      ...baseInput,
      requestBodyXml: '<enviNFe versao="4.00"><idLote>1</idLote></enviNFe>',
    });

    expect(captures).toHaveLength(1);
    // Sem escape: `&lt;enviNFe&gt;` seria recusado pelo órgão fiscal.
    expect(captures[0].body).toContain(
      '<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe versao="4.00">',
    );
    expect(captures[0].body).not.toContain('&lt;enviNFe');
    expect(result.responseBodyXml).toContain('<cStat>104</cStat>');
    expect(result.rawRequestXml).toBe(captures[0].body);
    expect(result.rawResponseXml).toContain('nfeResultMsg');
  });

  it('carries exactly one XML declaration, at the start of the envelope', async () => {
    // Uma segunda declaração no meio do documento faz o IIS da SEFAZ recusar
    // com HTTP 400 antes de qualquer processamento SOAP.
    await callSefazSoapOperation({
      ...baseInput,
      requestBodyXml: '<enviNFe versao="4.00"><idLote>1</idLote></enviNFe>',
    });

    const body = captures[0].body;
    expect(body.match(/<\?xml/g)).toHaveLength(1);
    expect(body.startsWith('<?xml')).toBe(true);
  });

  it('sets mutual TLS options (key/cert/ca) derived from the certificate PEM material on the request', async () => {
    await callSefazSoapOperation({ ...baseInput, requestBodyXml: '<x/>' });

    const { options } = captures[0];
    expect(options.key).toBe(baseInput.privateKeyPem);
    expect(options.cert).toBe(baseInput.certificatePem);
    expect(options.rejectUnauthorized).toBe(true);
    // Cadeia ICP-Brasil: sem ela o handshake falha antes de o certificado do
    // Emitente ser apresentado.
    // Trust store combinado: raizes publicas + cadeia ICP-Brasil. Passar so a
    // ICP-Brasil substituiria o padrao do Node e quebraria hosts com CA publica.
    expect(Array.isArray(options.ca)).toBe(true);
    expect((options.ca as string[]).length).toBeGreaterThan(1);
    expect(options.host).toBe('hnfe.sefaz.ba.gov.br');
    expect(options.path).toContain('/webservices/NFeAutorizacao4/');
  });

  it('retries on a transient network error and succeeds on the second attempt', async () => {
    let attempt = 0;
    responder = () => {
      attempt += 1;
      if (attempt === 1) {
        return Object.assign(new Error('socket hang up'), {
          code: 'ECONNRESET',
        });
      }
      return {
        statusCode: 200,
        body: SOAP_OK('<retEnviNFe><cStat>104</cStat></retEnviNFe>'),
      };
    };

    const result = await callSefazSoapOperation({
      ...baseInput,
      requestBodyXml: '<x/>',
      maxRetries: 2,
    });

    expect(attempt).toBe(2);
    expect(result.responseBodyXml).toContain('104');
  });

  it('throws SefazUnavailableError after exhausting retries on persistent communication failure', async () => {
    responder = () =>
      Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });

    await expect(
      callSefazSoapOperation({
        ...baseInput,
        requestBodyXml: '<x/>',
        maxRetries: 1,
      }),
    ).rejects.toBeInstanceOf(SefazUnavailableError);
  });

  /// HTTP 400 com corpo "Bad Request" foi exatamente o sintoma do envelope
  /// malformado. A mensagem interna precisa carregar status e corpo, senão o
  /// diagnóstico vira adivinhação.
  it('surfaces the HTTP status and body when the server rejects the request', async () => {
    responder = () => ({ statusCode: 400, body: 'Bad Request' });

    expect.assertions(3);
    try {
      await callSefazSoapOperation({
        ...baseInput,
        requestBodyXml: '<x/>',
        maxRetries: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SefazUnavailableError);
      const { internalMessage } = error as SefazUnavailableError;
      expect(internalMessage).toContain('statusCode=400');
      expect(internalMessage).toContain('Bad Request');
    }
  });
});
