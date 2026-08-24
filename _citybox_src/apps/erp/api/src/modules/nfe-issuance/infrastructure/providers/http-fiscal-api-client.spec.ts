import { Logger } from '@nestjs/common';
import { HttpFiscalApiClient } from './http-fiscal-api-client';
import * as fiscalServiceToken from '../../../nfse-issuance/infrastructure/providers/fiscal-service-token';

jest.mock(
  '../../../nfse-issuance/infrastructure/providers/fiscal-service-token',
);

const getFiscalServiceAccessToken = jest.mocked(
  fiscalServiceToken.getFiscalServiceAccessToken,
);

// spec erp/027 — mesma normalização de `nfse-issuance/infrastructure/providers/
// http-fiscal-api-client.spec.ts` (arquivo irmão, duplicado de propósito). Uma
// `FISCAL_API_URL` sem "/api" derrubava toda emissão em produção com 404
// silencioso, disfarçado de "Emitente não encontrado".
describe('HttpFiscalApiClient — normalização de FISCAL_API_URL (spec erp/027)', () => {
  const originalEnv = process.env.FISCAL_API_URL;
  const originalFetch = global.fetch;
  let client: HttpFiscalApiClient;
  let loggerWarnSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new HttpFiscalApiClient();
    getFiscalServiceAccessToken.mockReset();
    getFiscalServiceAccessToken.mockResolvedValue('valid-token');
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
    global.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.FISCAL_API_URL;
    else process.env.FISCAL_API_URL = originalEnv;
    jest.restoreAllMocks();
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
