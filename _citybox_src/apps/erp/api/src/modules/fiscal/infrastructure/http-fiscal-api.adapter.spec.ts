import { HttpFiscalApiAdapter } from './http-fiscal-api.adapter';

/**
 * spec erp/030, B1 — regressão dupla achada ao investigar por que a lista da
 * fiscal-api nunca carregava:
 * 1. `companyId` ia só como header `X-Company-Id`, mas `GET /v1/fiscal-documents`
 *    e `GET /v1/fiscal-documents/summary` na fiscal-api exigem o `companyId`
 *    como query param (`@Query`, 400 sem ele) — o header sozinho nunca bastou.
 * 2. Mesmo corrigido o param, o tipo de retorno do adapter (`{items, meta}`,
 *    `{..., canceled}`) nunca batia com o envelope real da fiscal-api
 *    (`{data, meta}`, `{data: {..., cancelled}}`) — a rota do erp-api repassa
 *    o retorno do adapter verbatim pro erp-web, que já espera o envelope
 *    `{data, ...}` (o mesmo que a fiscal-api produz).
 */
describe('HttpFiscalApiAdapter (spec erp/030)', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  let adapter: HttpFiscalApiAdapter;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.FISCAL_API_URL = 'http://fiscal-api:3116/api';
    process.env.KEYCLOAK_ISSUER = 'http://keycloak/realms/citybox-erp';
    process.env.KEYCLOAK_FISCAL_M2M_CLIENT_ID = 'fiscal-m2m';
    process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET = 'secret';

    adapter = new HttpFiscalApiAdapter();

    fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/protocol/openid-connect/token')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ access_token: 'service-token', expires_in: 300 }),
        });
      }
      if (url.includes('/fiscal-documents/summary')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                data: { total: 3, authorized: 2, cancelled: 1 },
              }),
            ),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: [{ documentId: 'doc-1' }],
              meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
            }),
          ),
      });
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('manda companyId como query param em listDocuments', async () => {
    await adapter.listDocuments({ companyId: 'company-1' });

    const listCall = fetchMock.mock.calls.find(([url]: [string]) =>
      url.includes('/fiscal-documents?'),
    ) as [string, RequestInit];
    expect(listCall[0]).toContain('companyId=company-1');
  });

  it('repassa o envelope {data, meta} de listDocuments sem remapear pra {items}', async () => {
    const result = await adapter.listDocuments({ companyId: 'company-1' });

    expect(result).toEqual({
      data: [{ documentId: 'doc-1' }],
      meta: { total: 1, page: 1, perPage: 20, totalPages: 1 },
    });
  });

  it('manda companyId como query param em getSummary', async () => {
    await adapter.getSummary('company-1');

    const summaryCall = fetchMock.mock.calls.find(([url]: [string]) =>
      url.includes('/fiscal-documents/summary'),
    ) as [string, RequestInit];
    expect(summaryCall[0]).toContain('companyId=company-1');
  });

  it('repassa o envelope {data: {..., cancelled}} de getSummary', async () => {
    const result = await adapter.getSummary('company-1');

    expect(result).toEqual({
      data: { total: 3, authorized: 2, cancelled: 1 },
    });
  });
});
