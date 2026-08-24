import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from './auth';
import { getMemorySession } from './auth';
import { getSessionBridge } from './session-bridge';
import { SessionProvider, useSession } from './session-context';

const SESSION_PAYLOAD: Session = {
  user: { name: 'Test User', email: 'test@example.com' },
  expiresAt: 9_999_999_999_999,
  permissions: ['vertical_access'],
};

function SessionProbe({ onSession }: { onSession: (session: Session | null) => void }) {
  const { session, status, refresh } = useSession();
  onSession(session);
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button type="button" data-testid="refresh" onClick={() => void refresh()}>
        refresh
      </button>
    </div>
  );
}

describe('SessionProvider', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => SESSION_PAYLOAD,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mantém referência de session quando refresh retorna payload equivalente', async () => {
    const seen: (Session | null)[] = [];

    render(
      <SessionProvider>
        <SessionProbe onSession={(s) => seen.push(s)} />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    const refAfterMount = seen.at(-1);
    expect(refAfterMount).not.toBeNull();

    fireEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(seen.at(-1)).toBe(refAfterMount);
  });

  it('patchUser atualiza React state e memorySession', async () => {
    function PatchProbe() {
      const { session, patchUser } = useSession();
      return (
        <div>
          <span data-testid="name">{session?.user?.name ?? ''}</span>
          <button type="button" data-testid="patch" onClick={() => patchUser({ name: 'Patched Name' })}>
            patch
          </button>
        </div>
      );
    }

    render(
      <SessionProvider>
        <PatchProbe />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Test User');
    });

    fireEvent.click(screen.getByTestId('patch'));

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Patched Name');
    });

    expect(getMemorySession()?.user.name).toBe('Patched Name');
  });

  it('registra session-bridge no mount', async () => {
    render(
      <SessionProvider>
        <span data-testid="mounted">ok</span>
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mounted')).toBeInTheDocument();
    });

    expect(getSessionBridge()).not.toBeNull();
    expect(typeof getSessionBridge()?.refresh).toBe('function');
    expect(typeof getSessionBridge()?.patchUser).toBe('function');
  });
});
