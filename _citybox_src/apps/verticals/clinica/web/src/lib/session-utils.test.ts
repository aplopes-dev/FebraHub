import { describe, expect, it } from 'vitest';
import type { Session } from './auth';
import { permissionsEqual, sessionsEqual } from './session-utils';

const baseSession = (): Session => ({
  user: { name: 'Ana', email: 'ana@example.com' },
  expiresAt: 1_700_000_000_000,
  permissions: ['platform.admin', 'vertical.comercio.view'],
});

describe('permissionsEqual', () => {
  it('ignora ordem dos elementos', () => {
    expect(permissionsEqual(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('detecta tamanhos diferentes', () => {
    expect(permissionsEqual(['a'], ['a', 'b'])).toBe(false);
  });

  it('detecta permissões distintas', () => {
    expect(permissionsEqual(['a'], ['b'])).toBe(false);
  });
});

describe('sessionsEqual', () => {
  it('retorna true para mesma referência', () => {
    const s = baseSession();
    expect(sessionsEqual(s, s)).toBe(true);
  });

  it('retorna true para conteúdo equivalente', () => {
    const a = baseSession();
    const b = {
      ...baseSession(),
      permissions: ['vertical.comercio.view', 'platform.admin'],
    };
    expect(sessionsEqual(a, b)).toBe(true);
  });

  it('retorna false quando um lado é null', () => {
    expect(sessionsEqual(baseSession(), null)).toBe(false);
    expect(sessionsEqual(null, null)).toBe(true);
  });

  it('retorna false quando expiresAt difere', () => {
    const a = baseSession();
    const b = { ...baseSession(), expiresAt: a.expiresAt + 1 };
    expect(sessionsEqual(a, b)).toBe(false);
  });

  it('retorna false quando e-mail difere', () => {
    const a = baseSession();
    const b = { ...baseSession(), user: { ...a.user, email: 'outro@example.com' } };
    expect(sessionsEqual(a, b)).toBe(false);
  });
});
