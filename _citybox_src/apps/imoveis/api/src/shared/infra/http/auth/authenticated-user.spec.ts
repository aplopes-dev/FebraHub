import { authenticatedUserFromJwtPayload } from './authenticated-user';

const CLIENT_ID = 'imoveis-web';

describe('authenticatedUserFromJwtPayload', () => {
  it('lê as realm roles do realm citybox-imoveis', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'service-account-admin-m2m',
        azp: 'admin-m2m',
        realm_access: { roles: ['platform.admin'] },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toContain('platform.admin');
    expect(user.sub).toBe('service-account-admin-m2m');
  });

  it('não infere platform.admin a partir do azp', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'service-account',
        azp: 'admin-m2m',
        resource_access: { 'admin-m2m': { roles: ['uma_protection'] } },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).not.toContain('platform.admin');
  });

  it('lê as client roles do client configurado, não de um literal', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-1',
        azp: CLIENT_ID,
        resource_access: {
          [CLIENT_ID]: { roles: ['corretor'] },
          'outro-client': { roles: ['nao-deve-entrar'] },
        },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toEqual(['corretor']);
  });

  it('lê username e e-mail do token', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-2',
        preferred_username: 'ana@imob.com',
        email: 'ana@imob.com',
      },
      { clientId: CLIENT_ID },
    );

    expect(user.username).toBe('ana@imob.com');
    expect(user.email).toBe('ana@imob.com');
    expect(user.roles).toEqual([]);
  });
});
