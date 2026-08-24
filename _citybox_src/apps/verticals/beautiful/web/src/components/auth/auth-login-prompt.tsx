'use client';

import { useState } from 'react';
import LoginOutlined from '@mui/icons-material/LoginOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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
        setLoginError('Não foi possível conectar ao serviço de autenticação. Tente novamente.');
        setButtonLoading(false);
      });
  };

  const buttonLabel =
    forceLogin && !loggedOut && !exchangeFailed ? 'Entrar novamente' : 'Entrar no sistema';

  return (
    <AuthPageShell
      title="Acesso ao Beautiful"
      description="Entre com sua conta para gerenciar agenda, catálogo e clientes."
    >
      <Stack spacing={1.5} sx={{ mb: 3 }}>
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
      </Stack>

      <Stack spacing={1.5}>
        <Button
          size="large"
          variant="contained"
          fullWidth
          disabled={buttonLoading}
          onClick={startLogin}
          startIcon={
            buttonLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LoginOutlined sx={{ fontSize: 18 }} />
            )
          }
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
