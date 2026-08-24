import { authenticatedUserFromJwtPayload } from './authenticated-user';

describe('authenticatedUserFromJwtPayload', () => {
  it('lê a realm role platform.admin do token do admin-m2m', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'service-account-admin-m2m',
        azp: 'admin-m2m',
        realm_access: { roles: ['platform.admin'] },
      },
      { clientId: 'erp-web' },
    );

    expect(user.roles).toContain('platform.admin');
  });

  it('lê as client roles do client configurado, e não de um literal', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-sub',
        azp: 'erp-web',
        realm_access: { roles: ['offline_access'] },
        resource_access: {
          'erp-web': { roles: ['store.catalog.manage'] },
          'outro-client': { roles: ['nao.deve.vazar'] },
        },
      },
      { clientId: 'erp-web' },
    );

    expect(user.roles).toContain('offline_access');
    expect(user.roles).toContain('store.catalog.manage');
    expect(user.roles).not.toContain('nao.deve.vazar');
  });

  it('não promove nenhum client a platform.admin', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-sub',
        azp: 'erp-web',
        realm_access: { roles: [] },
        resource_access: { 'erp-web': { roles: [] } },
      },
      { clientId: 'erp-web' },
    );

    expect(user.roles).not.toContain('platform.admin');
  });
});
