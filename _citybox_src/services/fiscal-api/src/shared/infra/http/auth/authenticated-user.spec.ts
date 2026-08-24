import { applyActingSub, type AuthenticatedUser } from './authenticated-user';

function baseUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    sub: 'service-account-sub',
    roles: ['fiscal_operator'],
    ...overrides,
  };
}

describe('applyActingSub (BUG-01)', () => {
  it('token de serviço + X-Acting-Sub válido → usa o sub do header', () => {
    const user = baseUser({ azp: 'citybox-fiscal-service' });

    const result = applyActingSub(user, 'real-member-sub');

    expect(result.sub).toBe('real-member-sub');
    // Imutabilidade: não muta o objeto original.
    expect(user.sub).toBe('service-account-sub');
  });

  it('token de serviço SEM o header → sub vira "unknown" (fail-closed, negado a jusante)', () => {
    const user = baseUser({ azp: 'citybox-fiscal-service' });

    const result = applyActingSub(user, undefined);

    expect(result.sub).toBe('unknown');
  });

  it('token de serviço com header vazio/espaços → também fail-closed', () => {
    const user = baseUser({ azp: 'citybox-fiscal-service' });

    expect(applyActingSub(user, '').sub).toBe('unknown');
    expect(applyActingSub(user, '   ').sub).toBe('unknown');
  });

  it('token de usuário comum (azp diferente) → header é ignorado', () => {
    const user = baseUser({ azp: 'citybox-backoffice', sub: 'real-user-sub' });

    const result = applyActingSub(user, 'attempted-spoof-sub');

    expect(result.sub).toBe('real-user-sub');
  });

  it('token sem azp (ex.: dev bypass) → header é ignorado', () => {
    const user = baseUser({ azp: undefined, sub: 'dev-admin' });

    const result = applyActingSub(user, 'attempted-spoof-sub');

    expect(result.sub).toBe('dev-admin');
  });
});
