import {
  authenticatedUserFromJwtPayload,
  devBypassAuthenticatedUser,
  formatAuditActor,
} from './authenticated-user';

describe('formatAuditActor', () => {
  it('should combine username and email when both exist', () => {
    expect(
      formatAuditActor({
        sub: 'uuid',
        username: 'admin',
        email: 'admin@citybox.com',
      }),
    ).toBe('admin · admin@citybox.com');
  });

  it('should fall back to username or email', () => {
    expect(formatAuditActor({ sub: 'uuid', username: 'admin' })).toBe('admin');
    expect(formatAuditActor({ sub: 'uuid', email: 'admin@citybox.com' })).toBe(
      'admin@citybox.com',
    );
    expect(formatAuditActor({ sub: 'uuid-only' })).toBe('uuid-only');
  });
});

describe('authenticatedUserFromJwtPayload', () => {
  it('should read Keycloak claims', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'kc-sub',
        preferred_username: 'platform.admin',
        email: 'platform.admin@citybox.com',
        realm_access: { roles: ['platform_admin'] },
      },
      { clientId: 'admin-web' },
    );

    expect(user).toEqual({
      sub: 'kc-sub',
      roles: ['platform_admin'],
      username: 'platform.admin',
      email: 'platform.admin@citybox.com',
    });
  });

  it('should merge client roles of the configured client', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'kc-sub',
        preferred_username: 'operador',
        email: 'operador@citybox.com',
        realm_access: { roles: ['platform_operator'] },
        resource_access: {
          'admin-web': { roles: ['platform_admin'] },
        },
      },
      { clientId: 'admin-web' },
    );

    expect(user.roles).toEqual(
      expect.arrayContaining(['platform_operator', 'platform_admin']),
    );
  });

  // Invariante do ADR C-16: o client é o do próprio app. Role de outro client
  // do mesmo realm não vaza para dentro do `AuthenticatedUser`.
  it('should ignore client roles of other clients in the realm', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'kc-sub',
        realm_access: { roles: ['platform_operator'] },
        resource_access: {
          'admin-provisioning': { roles: ['platform_admin'] },
        },
      },
      { clientId: 'admin-web' },
    );

    expect(user.roles).toEqual(['platform_operator']);
  });

  it('should deduplicate overlapping realm and client roles', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'kc-sub',
        realm_access: { roles: ['platform_admin'] },
        resource_access: {
          'admin-web': { roles: ['platform_admin'] },
        },
      },
      { clientId: 'admin-web' },
    );

    expect(user.roles).toEqual(['platform_admin']);
  });
});

describe('devBypassAuthenticatedUser', () => {
  it('should include username and email for local dev', () => {
    const user = devBypassAuthenticatedUser();
    expect(user.username).toBeTruthy();
    expect(user.email).toBeTruthy();
    expect(formatAuditActor(user)).toContain('admin');
  });
});
