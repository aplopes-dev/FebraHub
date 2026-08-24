'use client';

import { useState } from 'react';
import LoginIcon from '@mui/icons-material/Login';
import { Button, Stack, Typography } from '@citybox/mui/atoms';
import { AuthPageShell, AuthStatusPanel } from '@/components/auth/auth-page-shell';
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
        setLoginError(
          process.env.NODE_ENV !== 'production'
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
      title="Acesso ao painel"
      description="Entre com sua conta para acessar o sistema de imóveis."
    >
      <Stack spacing={2}>
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
            message="Falha ao completar o login. Verifique se o Keycloak está ativo e tente novamente."
          />
        ) : null}

        {loginError ? <AuthStatusPanel variant="error" message={loginError} /> : null}

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={buttonLoading}
          startIcon={!buttonLoading ? <LoginIcon /> : undefined}
          onClick={startLogin}
        >
          {buttonLoading ? 'Redirecionando…' : buttonLabel}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Você será redirecionado para a autenticação segura da plataforma
        </Typography>
      </Stack>
    </AuthPageShell>
  );
}
