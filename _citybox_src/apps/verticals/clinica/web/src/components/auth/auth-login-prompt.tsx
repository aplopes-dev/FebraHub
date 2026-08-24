'use client';

import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { AuthStatusPanel } from '@/components/auth/auth-status-panel';
import { getLoginUrl } from '@/lib/auth';

type AuthLoginPromptProps = {
  forceLogin?: boolean;
  loggedOut?: boolean;
  exchangeFailed?: boolean;
};

export function AuthLoginPrompt({
  forceLogin = false,
  loggedOut = false,
  exchangeFailed = false,
}: AuthLoginPromptProps) {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const startLogin = () => {
    setLoginError(null);
    setButtonLoading(true);
    const redirectUri = `${window.location.origin}/auth/callback`;
    void getLoginUrl(redirectUri, forceLogin || exchangeFailed || loggedOut)
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
        setButtonLoading(false);
      });
  };

  const buttonLabel =
    forceLogin && !loggedOut && !exchangeFailed ? 'Entrar novamente' : 'Entrar no sistema';

  return (
    <AuthPageShell
      title="Acesso ao backoffice"
      description="Entre com sua conta para acessar o sistema da clínica."
    >
      <div className="mb-6 flex flex-col gap-3">
        {loggedOut && !loginError ? (
          <AuthStatusPanel variant="success" message="Você saiu com sucesso." />
        ) : null}

        {forceLogin && !loggedOut && !exchangeFailed && !loginError ? (
          <AuthStatusPanel
            variant="warning"
            message="Sua sessão expirou. Entre novamente para continuar."
          />
        ) : null}

        {exchangeFailed && !loginError ? (
          <AuthStatusPanel
            variant="error"
            message="Falha ao completar o login. Verifique se o serviço está ativo e tente novamente."
          />
        ) : null}

        {loginError ? <AuthStatusPanel variant="error" message={loginError} /> : null}
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" disabled={buttonLoading} onClick={startLogin}>
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
    </AuthPageShell>
  );
}
