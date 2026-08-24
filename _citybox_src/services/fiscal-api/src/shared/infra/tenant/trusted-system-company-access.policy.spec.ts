import { TrustedSystemCompanyAccessPolicy } from './trusted-system-company-access.policy';
import type { AuthenticatedUser } from '../http/auth/authenticated-user';

const COMPANY = '0196f0a0-0000-7000-8000-0000000000aa';

/**
 * Substitui `tests/integration/company-access-policy.integration.spec.ts`.
 *
 * Aquele era um teste de **integração com banco** porque a policy anterior
 * resolvia `sub → platform.members → platform.store_members`, atravessando o
 * schema de outro serviço — e o teste existia justamente para avisar quando o
 * `admin-api` renomeasse alguma dessas colunas.
 *
 * Com a autorização por `azp` (ADR C-16), não há mais consulta nem fronteira de
 * schema para vigiar: o teste correto é unitário. O que continua valendo é a
 * postura de **negar por padrão**, que os casos abaixo cobrem.
 */
describe('TrustedSystemCompanyAccessPolicy', () => {
  const policy = new TrustedSystemCompanyAccessPolicy();

  function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
    return { sub: 'service-account-fiscal-m2m', roles: [], ...overrides };
  }

  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.AUTH_DEV_BYPASS;

  beforeEach(() => {
    process.env.KEYCLOAK_ALLOWED_AZP = 'fiscal-m2m';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.AUTH_DEV_BYPASS = originalBypass;
  });

  describe('recusa por padrão', () => {
    it('nega token sem azp — não dá para saber qual sistema chamou', async () => {
      await expect(policy.canActFor(COMPANY, user())).resolves.toBe(false);
    });

    it('nega azp vazio ou só espaços', async () => {
      await expect(
        policy.canActFor(COMPANY, user({ clientId: '   ' })),
      ).resolves.toBe(false);
    });

    it('nega client fora da allowlist', async () => {
      await expect(
        policy.canActFor(COMPANY, user({ clientId: 'outro-sistema-m2m' })),
      ).resolves.toBe(false);
    });

    it('NEGA client de usuário final, mesmo do realm certo', async () => {
      // É a barreira que impede o browser de pular a validação de tenant que a
      // erp-api faz antes de chamar. Sem ela, um token de `erp-web` chegaria
      // aqui direto e escolheria o Emitente.
      await expect(
        policy.canActFor(COMPANY, user({ clientId: 'erp-web' })),
      ).resolves.toBe(false);
    });
  });

  describe('libera o chamador declarado', () => {
    it('aceita o client da allowlist', async () => {
      await expect(
        policy.canActFor(COMPANY, user({ clientId: 'fiscal-m2m' })),
      ).resolves.toBe(true);
    });

    it('aceita qualquer um dos clients quando a allowlist tem vários', async () => {
      process.env.KEYCLOAK_ALLOWED_AZP = 'fiscal-m2m, clinica-fiscal-m2m';
      await expect(
        policy.canActFor(COMPANY, user({ clientId: 'clinica-fiscal-m2m' })),
      ).resolves.toBe(true);
    });
  });

  /// Dev bypass (`AUTH_DEV_BYPASS`): o `AuthGuard` injeta `platform.admin` sem
  /// `azp` para o token `dev-admin`. Sem tratamento, a allowlist negaria — e as
  /// rotas por Emitente (DANFSE, séries, CSC) davam 404 em desenvolvimento.
  describe('dev bypass (platform.admin)', () => {
    it('libera platform.admin fora de produção com AUTH_DEV_BYPASS=true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_DEV_BYPASS = 'true';
      await expect(
        policy.canActFor(COMPANY, user({ roles: ['platform.admin'] })),
      ).resolves.toBe(true);
    });

    it('NÃO libera quando AUTH_DEV_BYPASS não está ligado', async () => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_DEV_BYPASS = 'false';
      await expect(
        policy.canActFor(COMPANY, user({ roles: ['platform.admin'] })),
      ).resolves.toBe(false);
    });

    it('NÃO libera em produção, mesmo com a flag e o role', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH_DEV_BYPASS = 'true';
      await expect(
        policy.canActFor(COMPANY, user({ roles: ['platform.admin'] })),
      ).resolves.toBe(false);
    });
  });
});
