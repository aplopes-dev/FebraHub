'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, LogIn } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { Logo } from '@citybox/ui/molecules';
import { getLoginUrl } from '@/lib/auth';

function readLoginQuery() {
  const sp = new URLSearchParams(window.location.search);
  return {
    forceLogin: sp.get('reauth') === '1',
    loggedOut: sp.get('loggedOut') === '1',
    exchangeFailed: sp.get('error') === 'exchange_failed',
  };
}

export default function LoginPage() {
  const started = useRef(false);
  const [loggedOut, setLoggedOut] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);
  const [exchangeFailed, setExchangeFailed] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const query = readLoginQuery();
    setLoggedOut(query.loggedOut);
    setForceLogin(query.forceLogin);
    setExchangeFailed(query.exchangeFailed);

    if (query.loggedOut || query.exchangeFailed) {
      setShowButton(true);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    void getLoginUrl(redirectUri, query.forceLogin)
      .then((url) => {
        window.location.href = url;
      })
      .catch((err: unknown) => {
        console.error('[login] getLoginUrl falhou:', err instanceof Error ? err.message : String(err));
        const isDev = process.env.NODE_ENV !== 'production';
        setLoginError(
          isDev
            ? 'Não foi possível conectar ao Keycloak (verifique se está rodando em :8080).'
            : 'Não foi possível conectar ao serviço de autenticação. Tente novamente.',
        );
        setShowButton(true);
      });

    const timeout = window.setTimeout(() => {
      setLoginError('O redirecionamento demorou. Clique abaixo para tentar novamente.');
      setShowButton(true);
    }, 8000);

    return () => window.clearTimeout(timeout);
  }, []);

  const startLogin = () => {
    setLoginError(null);
    setExchangeFailed(false);
    setShowButton(false);
    setButtonLoading(true);
    const redirectUri = `${window.location.origin}/auth/callback`;
    void getLoginUrl(redirectUri, forceLogin || exchangeFailed)
      .then((url) => {
        window.location.href = url;
      })
      .catch((err: unknown) => {
        console.error('[login] getLoginUrl falhou:', err instanceof Error ? err.message : String(err));
        const isDev = process.env.NODE_ENV !== 'production';
        setLoginError(
          isDev
            ? 'Não foi possível conectar ao Keycloak (verifique se está rodando em :8080).'
            : 'Não foi possível conectar ao serviço de autenticação. Tente novamente.',
        );
        setShowButton(true);
        setButtonLoading(false);
      });
  };

  const isRedirecting = !loggedOut && !loginError && !showButton;
  const isSessionExpired = forceLogin && !loggedOut && !exchangeFailed && !loginError;

  const redirectingMessage = isSessionExpired
    ? 'Sessão expirada — redirecionando para nova autenticação…'
    : 'Redirecionando para autenticação segura…';

  const buttonLabel = isSessionExpired && !exchangeFailed ? 'Entrar novamente' : 'Fazer login';

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="rounded-2xl border bg-card px-8 py-10 shadow-sm">

          {/* Logo */}
          <Logo variant="full" className="mb-8 h-8" brandGradient="primary" />

          {/* Cabeçalho */}
          <div className="mb-7">
            <h1 className="text-xl font-semibold tracking-tight">Acesso ao painel</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Entrar requer autenticação SSO com sua conta de operador.
            </p>
          </div>

          {/* Área de status */}
          <div className="mb-6 flex flex-col gap-3">

            {isRedirecting ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{redirectingMessage}</span>
              </div>
            ) : null}

            {loggedOut && !loginError ? (
              <div className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                <CheckCircle className="size-4 shrink-0" />
                <span>Você saiu com sucesso.</span>
              </div>
            ) : null}

            {isSessionExpired && showButton ? (
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="size-4 shrink-0" />
                <span>Sua sessão expirou. Entre novamente para continuar.</span>
              </div>
            ) : null}

            {exchangeFailed && !loginError ? (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Falha ao completar o login. Verifique se o serviço está ativo e tente novamente.
                </span>
              </div>
            ) : null}

            {loginError ? (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            ) : null}

          </div>

          {/* Botão SSO */}
          {showButton || loggedOut ? (
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full"
                disabled={buttonLoading}
                onClick={startLogin}
              >
                {buttonLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                {buttonLoading ? 'Redirecionando…' : buttonLabel}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Você será redirecionado para a autenticação segura da plataforma
              </p>
            </div>
          ) : null}

        </div>

        {/* Rodapé */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Acesso restrito · Somente operadores autorizados
        </p>

      </div>
    </main>
  );
}
