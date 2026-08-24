import { Logger } from '@nestjs/common';
import { HttpFiscalApiClient } from './http-fiscal-api-client';
import { FiscalApiEmissionError } from '../../domain/errors/fiscal-api-emission.error';
import * as fiscalServiceToken from './fiscal-service-token';

jest.mock('./fiscal-service-token');

const getFiscalServiceAccessToken = jest.mocked(
  fiscalServiceToken.getFiscalServiceAccessToken,
);

describe('HttpFiscalApiClient (spec erp/025, P1)', () => {
  const originalFetch = global.fetch;
  let client: HttpFiscalApiClient;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    client = new HttpFiscalApiClient();
    getFiscalServiceAccessToken.mockReset();
    getFiscalServiceAccessToken.mockResolvedValue('valid-token');
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('[FiscalAuth] falha de autenticação/configuração gera log distinto e mensagem de negócio própria — nunca a mensagem genérica de transporte', async () => {
    getFiscalServiceAccessToken.mockRejectedValue(
      new Error('KEYCLOAK_FISCAL_M2M_CLIENT_SECRET não configurado'),
    );
    global.fetch = jest.fn();

    await expect(client.findCompanyIdByCnpj('11444777000161')).rejects.toThrow(
      /autenticação/i,
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FiscalAuth]'),
    );
  });

  it('[FiscalTransport] falha de rede (fetch rejeita) gera log distinto e mensagem genérica de "tente novamente"', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:3116'));

    let caught: unknown;
    try {
      await client.findCompanyIdByCnpj('11444777000161');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(FiscalApiEmissionError);
    expect((caught as FiscalApiEmissionError).externalMessage).toMatch(
      /não foi possível contatar/i,
    );
    // A mensagem de negócio (externalMessage) nunca vaza host/porta interno.
    expect((caught as FiscalApiEmissionError).externalMessage).not.toContain(
      '3116',
    );
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FiscalTransport]'),
    );
  });

  it('[FiscalBusiness] recusa da fiscal-api (HTTP não-ok) gera log distinto e traduz o código do órgão', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({ error: { code: 'E0116', message: 'IM ausente' } }),
    });

    await expect(
      client.issueNfse({
        companyId: 'company-1',
        sourceSystem: 'erp',
        externalReference: 'ref-1',
        idempotencyKey: 'ref-1',
        environment: 'HOMOLOGATION',
        customer: {
          documentType: 'CPF',
          document: '12345678900',
          name: 'Cliente',
        },
        nfse: {
          serviceDescription: 'Serviço',
          municipalServiceCode: '01.07',
          issWithheld: false,
        },
        items: [],
      }),
    ).rejects.toThrow(/CNC/i);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FiscalBusiness]'),
    );
  });

  it('resolve o Emitente com id + defaultEnvironment a partir da resposta da fiscal-api', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: 'company-1', defaultEnvironment: 'PRODUCTION' }],
        }),
    });

    const result = await client.findCompanyIdByCnpj('11444777000161');

    expect(result).toEqual({
      id: 'company-1',
      defaultEnvironment: 'PRODUCTION',
    });
  });

  it('cai em HOMOLOGATION quando defaultEnvironment vem ausente/inválido — nunca assume PRODUCTION por omissão', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 'company-1' }] }),
    });

    const result = await client.findCompanyIdByCnpj('11444777000161');

    expect(result).toEqual({
      id: 'company-1',
      defaultEnvironment: 'HOMOLOGATION',
    });
  });

  // spec erp/027 — FISCAL_API_URL sem "/api" derrubava toda emissão em
  // produção com 404 silencioso, disfarçado de "Emitente não encontrado".
  describe('normalização de FISCAL_API_URL (spec erp/027)', () => {
    const originalEnv = process.env.FISCAL_API_URL;
    let loggerWarnSpy: jest.SpyInstance;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'company-1' }] }),
      });
      global.fetch = fetchMock;
    });

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.FISCAL_API_URL;
      else process.env.FISCAL_API_URL = originalEnv;
    });

    it('acrescenta "/api" quando a variável não termina nele, e loga aviso', async () => {
      process.env.FISCAL_API_URL = 'http://fiscal-api:3116';

      await client.findCompanyIdByCnpj('11444777000161');

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toBe(
        'http://fiscal-api:3116/api/v1/companies?cnpj=11444777000161',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FiscalConfig]'),
      );
    });

    it('não duplica o sufixo quando a variável já termina em "/api"', async () => {
      process.env.FISCAL_API_URL = 'http://fiscal-api:3116/api';

      await client.findCompanyIdByCnpj('11444777000161');

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toBe(
        'http://fiscal-api:3116/api/v1/companies?cnpj=11444777000161',
      );
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('remove barra final antes de normalizar — não produz "//api"', async () => {
      process.env.FISCAL_API_URL = 'http://fiscal-api:3116/';

      await client.findCompanyIdByCnpj('11444777000161');

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toBe(
        'http://fiscal-api:3116/api/v1/companies?cnpj=11444777000161',
      );
    });

    it('cai no default quando a variável está vazia', async () => {
      process.env.FISCAL_API_URL = '';

      await client.findCompanyIdByCnpj('11444777000161');

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toBe(
        'http://127.0.0.1:3116/api/v1/companies?cnpj=11444777000161',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FiscalConfig]'),
      );
    });

    it('cai no default quando a variável só tem espaços em branco (achado do typescript-reviewer)', async () => {
      process.env.FISCAL_API_URL = '   ';

      await client.findCompanyIdByCnpj('11444777000161');

      const [calledUrl] = fetchMock.mock.calls[0] as [string];
      expect(calledUrl).toBe(
        'http://127.0.0.1:3116/api/v1/companies?cnpj=11444777000161',
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FiscalConfig]'),
      );
    });
  });
});
