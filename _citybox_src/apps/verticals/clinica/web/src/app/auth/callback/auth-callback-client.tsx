'use client';

import { useEffect, useRef } from 'react';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { exchangeCode, getLoginUrl } from '@/lib/auth';
import { clearOAuthPending, peekOAuthPending } from '@/lib/oauth-pkce';

function readOAuthParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    error: sp.get('error'),
    state: sp.get('state'),
    code: sp.get('code'),
  };
}

export function AuthCallbackClient() {
  const inFlight = useRef(false);

  useEffect(() => {
    if (inFlight.current) return;
    inFlight.current = true;

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
        window.location.replace('/login?error=exchange_failed');
      }
    })();
  }, []);

  return <AuthLoadingShell message="Autenticando…" />;
}
