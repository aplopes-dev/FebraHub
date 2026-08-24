import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks-stub'),
}));

jest.mock('../../keycloak/keycloak-jwt', () => {
  const actual = jest.requireActual('../../keycloak/keycloak-jwt');
  return {
    allowedAuthorizedParties: actual.allowedAuthorizedParties,
    verifyKeycloakJwt: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyKeycloakJwt } = require('../../keycloak/keycloak-jwt') as {
  verifyKeycloakJwt: jest.Mock;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AuthGuard } = require('./auth.guard') as {
  AuthGuard: new (reflector: Reflector) => {
    canActivate: (ctx: ExecutionContext) => Promise<boolean>;
  };
};

function mockContext(headers: Record<string, string> = {}): ExecutionContext {
  const req = { headers, user: undefined as unknown };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

function guardWith(isPublic: boolean) {
  const reflector = {
    getAllAndOverride: (key: string) =>
      key === IS_PUBLIC_KEY ? isPublic : undefined,
  } as unknown as Reflector;
  return new AuthGuard(reflector);
}

describe('AuthGuard', () => {
  const env = { ...process.env };

  beforeEach(() => {
    verifyKeycloakJwt.mockReset();
    process.env.KEYCLOAK_ISSUER =
      'http://127.0.0.1:8080/realms/citybox-beautiful';
    process.env.KEYCLOAK_CLIENT_ID = 'beautiful-web';
    process.env.KEYCLOAK_ALLOWED_AZP = 'beautiful-web,admin-m2m';
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('libera rotas @Public sem Bearer', async () => {
    await expect(guardWith(true).canActivate(mockContext())).resolves.toBe(
      true,
    );
  });

  it('rejeita ausência de Bearer', async () => {
    await expect(
      guardWith(false).canActivate(mockContext()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita Bearer dev-admin com AUTH_DEV_BYPASS fora de produção', async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_DEV_BYPASS = 'true';

    const ctx = mockContext({ authorization: 'Bearer dev-admin' });
    await expect(guardWith(false).canActivate(ctx)).resolves.toBe(true);
    const req = ctx.switchToHttp().getRequest<{ user?: { sub: string } }>();
    expect(req.user?.sub).toBe('dev-admin');
    expect(verifyKeycloakJwt).not.toHaveBeenCalled();
  });

  it('rejeita Bearer dev-admin em produção', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_DEV_BYPASS = 'true';
    verifyKeycloakJwt.mockRejectedValue(new Error('assinatura inválida'));

    await expect(
      guardWith(false).canActivate(
        mockContext({ authorization: 'Bearer dev-admin' }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('aceita azp do client web e popula o usuário', async () => {
    verifyKeycloakJwt.mockResolvedValue({
      payload: {
        sub: 'user-1',
        azp: 'beautiful-web',
        preferred_username: 'ana',
        realm_access: { roles: ['salon.owner'] },
      },
    });

    const ctx = mockContext({ authorization: 'Bearer token-valido' });
    await expect(guardWith(false).canActivate(ctx)).resolves.toBe(true);
    const req = ctx
      .switchToHttp()
      .getRequest<{ user?: { sub: string; roles: string[] } }>();
    expect(req.user?.sub).toBe('user-1');
    expect(req.user?.roles).toEqual(['salon.owner']);
  });

  it('aceita azp do M2M do admin', async () => {
    verifyKeycloakJwt.mockResolvedValue({
      payload: { sub: 'sa', azp: 'admin-m2m' },
    });

    await expect(
      guardWith(false).canActivate(
        mockContext({ authorization: 'Bearer token-m2m' }),
      ),
    ).resolves.toBe(true);
  });

  it('rejeita token de outro client do mesmo realm', async () => {
    verifyKeycloakJwt.mockResolvedValue({
      payload: { sub: 'user-2', azp: 'beautiful-provisioning' },
    });

    await expect(
      guardWith(false).canActivate(
        mockContext({ authorization: 'Bearer token-de-outro-client' }),
      ),
    ).rejects.toThrow(/Client não autorizado: beautiful-provisioning/);
  });

  it('rejeita token sem azp', async () => {
    verifyKeycloakJwt.mockResolvedValue({ payload: { sub: 'user-3' } });

    await expect(
      guardWith(false).canActivate(
        mockContext({ authorization: 'Bearer token-sem-azp' }),
      ),
    ).rejects.toThrow(/Client não autorizado: \(ausente\)/);
  });
});
