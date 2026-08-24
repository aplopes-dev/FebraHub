/** Monta um JWT sintético (header/payload/assinatura fake) só com `exp` legível. */
function fakeJwt(expiresInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  ).toString('base64url');
  return `${header}.${payload}.signature`;
}

describe('fiscal-service-token (erp-api)', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  // O cache (`cachedToken`/`inFlight`) é module-level — um `import` estático
  // no topo do arquivo compartilharia o mesmo cache entre todos os testes.
  // `jest.resetModules()` + `require` dinâmico por teste garante módulo (e
  // cache) novos a cada `beforeEach`.
  let getFiscalServiceAccessToken: () => Promise<string>;

  beforeEach(async () => {
    process.env.KEYCLOAK_ISSUER = 'https://auth.test/realms/citybox-erp';
    process.env.KEYCLOAK_FISCAL_M2M_CLIENT_ID = 'fiscal-m2m';
    process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET = 'test-secret';
    jest.resetModules();
    ({ getFiscalServiceAccessToken } = await import('./fiscal-service-token'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('obtém um token novo via client_credentials contra o KEYCLOAK_ISSUER', async () => {
    const token = fakeJwt(300);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: token, expires_in: 300 }),
    });
    global.fetch = fetchMock;

    const result = await getFiscalServiceAccessToken();

    expect(result).toBe(token);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://auth.test/realms/citybox-erp/protocol/openid-connect/token',
      expect.objectContaining({ method: 'POST' }),
    );
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = requestInit.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('client_id')).toBe('fiscal-m2m');
    expect(body.get('client_secret')).toBe('test-secret');
  });

  it('reusa o token em cache enquanto ainda for válido (não chama fetch de novo)', async () => {
    const token = fakeJwt(300);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: token }),
    });
    global.fetch = fetchMock;

    await getFiscalServiceAccessToken();
    await getFiscalServiceAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('renova o token perto do vencimento (dentro da folga de 60s) em vez de reusar', async () => {
    const almostExpired = fakeJwt(30); // 30s < folga de 60s
    const fresh = fakeJwt(300);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: almostExpired }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: fresh }),
      });
    global.fetch = fetchMock;

    const first = await getFiscalServiceAccessToken();
    const second = await getFiscalServiceAccessToken();

    expect(first).toBe(almostExpired);
    expect(second).toBe(fresh);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('deduplica chamadas concorrentes — N requests em paralelo disparam 1 fetch só', async () => {
    const token = fakeJwt(300);
    let resolveResponse: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = jest.fn().mockReturnValue(pending);
    global.fetch = fetchMock;

    const calls = [
      getFiscalServiceAccessToken(),
      getFiscalServiceAccessToken(),
      getFiscalServiceAccessToken(),
    ];
    resolveResponse({
      ok: true,
      json: () => Promise.resolve({ access_token: token }),
    });
    const results = await Promise.all(calls);

    expect(results).toEqual([token, token, token]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lança erro claro quando KEYCLOAK_FISCAL_M2M_CLIENT_SECRET não está configurado', async () => {
    delete process.env.KEYCLOAK_FISCAL_M2M_CLIENT_SECRET;
    global.fetch = jest.fn();

    await expect(getFiscalServiceAccessToken()).rejects.toThrow(
      'KEYCLOAK_FISCAL_M2M_CLIENT_SECRET não configurado',
    );
  });
});
