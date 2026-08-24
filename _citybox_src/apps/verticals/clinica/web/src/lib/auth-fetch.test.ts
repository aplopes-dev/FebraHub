import { afterEach, describe, expect, it, vi } from 'vitest';
import { refreshAuthSession } from './auth-fetch';
import { registerSessionBridge } from './session-bridge';
import type { Session } from './auth';

const BRIDGE_SESSION: Session = {
  user: { name: 'Bridge User', email: 'bridge@example.com' },
  expiresAt: 9_999_999_999_999,
  permissions: ['vertical_access'],
};

describe('refreshAuthSession', () => {
  afterEach(() => {
    registerSessionBridge(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('delega ao session-bridge quando registrado', async () => {
    const refresh = vi.fn(async () => BRIDGE_SESSION);
    registerSessionBridge({ refresh, patchUser: vi.fn() });

    const result = await refreshAuthSession();

    expect(refresh).toHaveBeenCalledOnce();
    expect(result).toEqual(BRIDGE_SESSION);
  });

  it('usa fallback de fetch quando bridge ausente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => BRIDGE_SESSION,
      })),
    );

    const result = await refreshAuthSession();

    expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });
    expect(result?.user.name).toBe('Bridge User');
  });
});
