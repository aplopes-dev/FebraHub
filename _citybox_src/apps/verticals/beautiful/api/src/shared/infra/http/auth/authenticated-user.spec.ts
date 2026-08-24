import {
  authenticatedUserFromJwtPayload,
  devBypassAuthenticatedUser,
  formatAuditActor,
} from './authenticated-user';
import { PLATFORM_ADMIN_ROLE } from '../decorators/permissions';

const CLIENT_ID = 'beautiful-web';

describe('authenticatedUserFromJwtPayload', () => {
  it('agrega realm roles + client roles do client configurado', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-1',
        preferred_username: 'ana',
        email: 'ana@example.com',
        realm_access: { roles: ['default-roles-citybox-beautiful'] },
        resource_access: {
          [CLIENT_ID]: { roles: ['salon.operator'] },
        },
      },
      { clientId: CLIENT_ID },
    );

    expect(user).toEqual({
      sub: 'user-1',
      username: 'ana',
      email: 'ana@example.com',
      roles: ['default-roles-citybox-beautiful', 'salon.operator'],
    });
  });

  it('ignora roles de outros clients do realm', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'user-2',
        resource_access: {
          'outro-client': { roles: ['nao-deveria-vazar'] },
        },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toEqual([]);
  });

  it('lê platform.admin do realm (service account admin-m2m)', () => {
    const user = authenticatedUserFromJwtPayload(
      {
        sub: 'service-account-admin-m2m',
        azp: 'admin-m2m',
        realm_access: { roles: [PLATFORM_ADMIN_ROLE] },
      },
      { clientId: CLIENT_ID },
    );

    expect(user.roles).toEqual([PLATFORM_ADMIN_ROLE]);
  });

  it('usa sub unknown quando payload sem sub', () => {
    const user = authenticatedUserFromJwtPayload({}, { clientId: CLIENT_ID });
    expect(user.sub).toBe('unknown');
    expect(user.roles).toEqual([]);
  });
});

describe('devBypassAuthenticatedUser', () => {
  it('retorna usuário de bypass com a role local do realm', () => {
    const user = devBypassAuthenticatedUser();
    expect(user.sub).toBe('dev-admin');
    expect(user.roles).toEqual([PLATFORM_ADMIN_ROLE]);
  });
});

describe('formatAuditActor', () => {
  it('formata username + email', () => {
    expect(
      formatAuditActor({
        sub: 'x',
        username: 'ana',
        email: 'ana@example.com',
      }),
    ).toBe('ana · ana@example.com');
  });

  it('cai no sub quando sem username/email', () => {
    expect(formatAuditActor({ sub: 'user-9' })).toBe('user-9');
  });
});
