import { authenticatedUserFromJwtPayload } from './authenticated-user';

const CLIENT_ID = 'clinica-web';

describe('authenticatedUserFromJwtPayload', () => {
  it('junta realm roles com as client roles do client do próprio app', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-sub',
        azp: CLIENT_ID,
        preferred_username: 'maria.silva',
        email: 'maria.silva@clinica.com.br',
        realm_access: { roles: ['offline_access'] },
        resource_access: {
          [CLIENT_ID]: { roles: ['clinic.reception'] },
        },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.sub).toBe('user-sub');
    expect(user.username).toBe('maria.silva');
    expect(user.email).toBe('maria.silva@clinica.com.br');
    expect(user.roles).toEqual(
      expect.arrayContaining(['offline_access', 'clinic.reception']),
    );
  });

  it('lê `platform.admin` do realm — é a role local do service account admin-m2m', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'sa-sub',
        azp: 'admin-m2m',
        preferred_username: 'service-account-admin-m2m',
        realm_access: { roles: ['platform.admin'] },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toContain('platform.admin');
  });

  // Regressão do defeito D3 (ADR C-16): não existe mais promoção implícita a
  // administrador de plataforma por `azp`. Quem não tem a realm role, não passa.
  it('não promove a platform.admin um token que só traz o azp', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'sa-sub',
        azp: 'admin-m2m',
        realm_access: { roles: ['offline_access'] },
        resource_access: { 'admin-m2m': { roles: ['uma_protection'] } },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).not.toContain('platform.admin');
  });

  it('ignora roles de clients que não são o do app', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-sub',
        azp: CLIENT_ID,
        resource_access: {
          'outro-client': { roles: ['platform.admin'] },
        },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toEqual([]);
  });
});
