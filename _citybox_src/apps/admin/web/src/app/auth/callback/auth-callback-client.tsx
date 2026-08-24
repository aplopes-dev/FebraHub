'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@citybox/ui/molecules';
import { clearOAuthPending, peekOAuthPending } from '@/lib/oauth-pkce';
import { exchangeCode, getLoginUrl } from '@/lib/auth';

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
        window.location.replace('/');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[auth-callback] exchangeCode falhou:', msg);
        window.location.replace('/login?error=exchange_failed');
      }
    })();
  }, []);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="symbol" className="h-12" brandGradient="primary" />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Citybox Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Operação da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Autenticando…</span>
        </div>
      </div>
    </main>
  );
}
