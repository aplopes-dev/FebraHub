import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from './auth';
import { PermissionsProvider, usePermissions } from './permissions-context';
import { SessionProvider } from './session-context';

const SESSION: Session = {
  user: { name: 'Perm User', email: 'perm@example.com' },
  expiresAt: 9_999_999_999_999,
  // Realm `citybox-clinica`: `platform.admin` é a role LOCAL do realm (admin-m2m).
  permissions: ['platform.admin', 'vertical_access'],
};

function PermissionsProbe() {
  const { permissions, loading, hasPermission } = usePermissions();
  return (
    <div>
      <span data-testid="loading">{loading ? 'yes' : 'no'}</span>
      <span data-testid="count">{permissions.length}</span>
      <span data-testid="admin">{hasPermission('platform.admin') ? 'yes' : 'no'}</span>
      <span data-testid="clinic">{hasPermission('vertical_access') ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('PermissionsProvider', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/auth/session')) {
          return { ok: true, json: async () => SESSION };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('expande permissões a partir da sessão sem marketplace-api', async () => {
    render(
      <SessionProvider>
        <PermissionsProvider>
          <PermissionsProbe />
        </PermissionsProvider>
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('admin')).toHaveTextContent('yes');
    expect(screen.getByTestId('clinic')).toHaveTextContent('yes');
    // Realm próprio: a expansão não inventa mais permissões a partir de um mapa de
    // realm roles — sobram as roles do token + `vertical_access`.
    expect(Number(screen.getByTestId('count').textContent)).toBe(2);
    expect(vi.mocked(fetch)).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/proxy/core/v1/auth/permissions'),
      expect.anything(),
    );
  });
});
