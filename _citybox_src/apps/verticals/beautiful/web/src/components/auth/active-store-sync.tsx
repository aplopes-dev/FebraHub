'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { clearActiveStoreStorage } from '@/lib/active-store-storage';
import { setActiveStoreId } from '@/lib/beautiful-api';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';
import { hasVerticalViewPermission } from '@/lib/vertical-permissions';

/** Mantém `beautifulFetch` alinhado ao store ativo. */
export function ActiveStoreSync({ children }: { children: ReactNode }) {
  const { storeId, loading, stores, storesLoadError } = useStore();
  const { session, logout, status } = useSession();

  useEffect(() => {
    setActiveStoreId(storeId || null);
  }, [storeId]);

  if (status === 'loading' || loading) {
    return <AuthLoadingShell message="Carregando loja…" />;
  }

  const permissions = session?.permissions ?? [];
  if (!hasVerticalViewPermission(permissions)) {
    return (
      <EmptyAccess
        title="Sem acesso ao Beautiful"
        message="Sua conta não tem acesso ao Beautiful. Peça acesso ao administrador."
        onLogout={() => {
          clearActiveStoreStorage();
          void logout();
        }}
      />
    );
  }

  if (storesLoadError === 'unauthorized') {
    return (
      <EmptyAccess
        title="Sessão inválida"
        message="Faça login novamente para continuar."
        onLogout={() => {
          clearActiveStoreStorage();
          void logout();
        }}
      />
    );
  }

  if (storesLoadError === 'unavailable') {
    return (
      <EmptyAccess
        title="Não foi possível carregar suas lojas"
        message="Tente novamente em instantes. Se o problema continuar, fale com o suporte."
        onLogout={() => {
          clearActiveStoreStorage();
          void logout();
        }}
      />
    );
  }

  if (stores.length === 0) {
    return (
      <EmptyAccess
        title="Nenhuma loja vinculada"
        message="Seu usuário ainda não está vinculado a uma loja Beautiful. Peça ao responsável para convidar você."
        onLogout={() => {
          clearActiveStoreStorage();
          void logout();
        }}
      />
    );
  }

  if (!storeId) {
    return <AuthLoadingShell message="Selecionando loja…" />;
  }

  return children;
}

function EmptyAccess({
  title,
  message,
  onLogout,
}: {
  title: string;
  message: string;
  onLogout: () => void;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={2} sx={{ maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary">{message}</Typography>
        <Button variant="contained" onClick={onLogout}>
          Sair
        </Button>
      </Stack>
    </Box>
  );
}
