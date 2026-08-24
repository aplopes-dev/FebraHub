'use client';

import { useEffect } from 'react';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { exchangeCode, getLoginUrl } from '@/lib/auth';
import { clearOAuthPending, peekOAuthPending } from '@/lib/oauth-pkce';

/** Sobrevive a remount do Strict Mode (useRef reinicia e dispara 2× o exchange). */
const exchangedCodes = new Set<string>();

function readOAuthParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    error: sp.get('error'),
    state: sp.get('state'),
    code: sp.get('code'),
  };
}

export function AuthCallbackClient() {
  useEffect(() => {
    void (async () => {
      const { error, state, code } = readOAuthParams();
      const redirectUri = `${window.location.origin}/auth/callback`;

      if (error === 'login_required' || error === 'interaction_required') {
        const url = await getLoginUrl(redirectUri, true);
        window.location.replace(url);
        return;
      }

      if (!code || !state) {
        window.location.replace('/login?reauth=1');
        return;
      }

      if (exchangedCodes.has(code)) {
        return;
      }
      exchangedCodes.add(code);

      const pending = peekOAuthPending(state);
      if (!pending || pending.redirectUri !== redirectUri) {
        window.location.replace('/login?reauth=1');
        return;
      }

      try {
        await exchangeCode(code, redirectUri, pending.codeVerifier);
        clearOAuthPending();
        window.location.replace('/entrada?fresh=1');
      } catch (err) {
        console.error('[auth-callback] exchangeCode falhou:', err);
        // Se outra execução já gravou cookies, não manda para exchange_failed.
        try {
          const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
          if (sessionRes.ok) {
            clearOAuthPending();
            window.location.replace('/entrada?fresh=1');
            return;
          }
        } catch {
          // ignora
        }
        window.location.replace('/login?error=exchange_failed');
      }
    })();
  }, []);

  return <AuthLoadingShell message="Autenticando…" />;
}
