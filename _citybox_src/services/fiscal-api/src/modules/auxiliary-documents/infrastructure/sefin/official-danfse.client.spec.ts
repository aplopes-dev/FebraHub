import { OfficialDanfseClient } from './official-danfse.client';
import * as httpClient from '../../../../shared/infra/fiscal-http/sefin-http-client';

const ACCESS_KEY = '29136062250031609000104000000000002026080715989993';
const REQUEST = {
  accessKey: ACCESS_KEY,
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
  certificatePem:
    '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
};

function pdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.4 conteudo do documento oficial');
}

describe('OfficialDanfseClient', () => {
  const client = new OfficialDanfseClient();
  let callSefin: jest.SpyInstance;

  beforeEach(() => {
    process.env.SEFIN_NACIONAL_DANFSE_ENDPOINT =
      'https://sefin.producaorestrita.nfse.gov.br/SefinNacional/danfse';
    callSefin = jest.spyOn(httpClient, 'callSefin');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SEFIN_NACIONAL_DANFSE_ENDPOINT;
  });

  /// ⚠️ O contrato inteiro deste cliente é: **nunca lançar**. A API oficial é
  /// preferida (FR-002a), não necessária — há caminho local completo. Se ele
  /// propagasse erro, uma instabilidade do órgão derrubaria a impressão de
  /// notas que o sistema gera sozinho.
  describe('fallback silencioso', () => {
    it('devolve null quando o orgao responde 501 — o caso REAL de hoje', async () => {
      callSefin.mockResolvedValue({ statusCode: 501, rawBody: '', json: null });

      await expect(client.fetch(REQUEST)).resolves.toBeNull();
    });

    it('devolve null em timeout, sem propagar o erro', async () => {
      callSefin.mockRejectedValue(new Error('Tempo limite de 2000ms excedido'));

      await expect(client.fetch(REQUEST)).resolves.toBeNull();
    });

    it('devolve null em erro de rede', async () => {
      callSefin.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(client.fetch(REQUEST)).resolves.toBeNull();
    });

    it('devolve null em 500 do orgao', async () => {
      callSefin.mockResolvedValue({
        statusCode: 500,
        rawBody: 'erro',
        json: null,
      });

      await expect(client.fetch(REQUEST)).resolves.toBeNull();
    });

    it('nao tenta chamada quando o endpoint nao esta configurado', async () => {
      delete process.env.SEFIN_NACIONAL_DANFSE_ENDPOINT;

      // Enquanto o órgão não publicar o serviço, esta é a situação NORMAL —
      // não é falha de configuração a ser alarmada.
      await expect(client.fetch(REQUEST)).resolves.toBeNull();
      expect(callSefin).not.toHaveBeenCalled();
    });
  });

  describe('resposta bem-sucedida', () => {
    it('devolve o PDF quando o orgao entrega base64 em JSON', async () => {
      callSefin.mockResolvedValue({
        statusCode: 200,
        rawBody: '{}',
        json: { danfseBase64: pdfBuffer().toString('base64') },
      });

      const result = await client.fetch(REQUEST);

      expect(result?.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('aceita o PDF entregue diretamente no corpo', async () => {
      callSefin.mockResolvedValue({
        statusCode: 200,
        rawBody: pdfBuffer().toString('binary'),
        json: null,
      });

      const result = await client.fetch(REQUEST);

      expect(result?.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('devolve null quando o corpo 200 NAO e um PDF', async () => {
      // Mais perigoso que um erro: entregar HTML de portal como documento
      // fiscal produz um arquivo que não abre, e o operador culpa a nota.
      callSefin.mockResolvedValue({
        statusCode: 200,
        rawBody: '<html>Portal indisponivel</html>',
        json: null,
      });

      await expect(client.fetch(REQUEST)).resolves.toBeNull();
    });
  });

  describe('orcamento de tempo', () => {
    it('usa timeout curto e NAO retenta', async () => {
      callSefin.mockResolvedValue({ statusCode: 501, rawBody: '', json: null });

      await client.fetch(REQUEST);

      // Retentar um 501 gasta o dobro do tempo para a mesma resposta — e o
      // usuário está esperando um PDF na tela (SC-001).
      expect(callSefin).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs: 2_000, maxRetries: 0 }),
      );
    });

    it('monta a URL com a chave de acesso', async () => {
      callSefin.mockResolvedValue({ statusCode: 501, rawBody: '', json: null });

      await client.fetch(REQUEST);

      expect(callSefin).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining(ACCESS_KEY) as string,
          method: 'GET',
        }),
      );
    });
  });
});
