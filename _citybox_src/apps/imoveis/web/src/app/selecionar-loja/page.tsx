'use client';

import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { AuthPageShell, AuthStatusPanel } from '@/components/auth/auth-page-shell';
import { verticalModulePath } from '@/lib/store-routing';
import { useAuthSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

export default function SelecionarLojaPage() {
  const router = useRouter();
  const { status, logout } = useAuthSession();
  const { accessibleStores, loading, setStore, storesLoadError, storeId } =
    useStore();
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isEntering, startEntering] = useTransition();
  const [autoEntered, setAutoEntered] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'anonymous') {
      router.replace('/login');
      return;
    }
    setReady(true);

    if (loading || autoEntered) return;

    if (accessibleStores.length === 1) {
      const only = accessibleStores[0];
      setAutoEntered(true);
      setStore(only.id, only.name, only.vertical);
      router.replace(verticalModulePath(only.vertical));
      return;
    }

    // Pré-seleciona a última loja usada no dropdown (multi-loja).
    if (!selectedId && storeId && accessibleStores.some((s) => s.id === storeId)) {
      setSelectedId(storeId);
    }
  }, [
    accessibleStores,
    autoEntered,
    loading,
    router,
    selectedId,
    setStore,
    status,
    storeId,
  ]);

  const enterSelected = () => {
    const store = accessibleStores.find((s) => s.id === selectedId);
    if (!store) return;
    setStore(store.id, store.name, store.vertical);
    startEntering(() => {
      router.push(verticalModulePath(store.vertical));
    });
  };

  if (!ready || loading) {
    return (
      <AuthPageShell
        title="Escolha a imobiliária"
        description="Selecione em qual loja deseja trabalhar."
      >
        <AuthStatusPanel variant="loading" message="Carregando suas lojas…" />
      </AuthPageShell>
    );
  }

  if (storesLoadError === 'unavailable') {
    return (
      <AuthPageShell
        title="Serviço indisponível"
        description="Não foi possível carregar suas lojas agora."
      >
        <Box sx={{ mb: 3 }}>
          <AuthStatusPanel
            variant="warning"
            message="Falha ao consultar GET /v1/members/me (imoveis-api :3112). Confirme que a API está no ar e que as migrations do schema imoveis foram aplicadas (pnpm --filter @citybox/imoveis-api db:migrate:deploy)."
          />
        </Box>
        <Button variant="outlined" fullWidth onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </AuthPageShell>
    );
  }

  if (accessibleStores.length === 0) {
    return (
      <AuthPageShell
        title="Nenhuma loja disponível"
        description="Sua conta ainda não está vinculada a uma imobiliária."
      >
        <Box sx={{ mb: 3 }}>
          <AuthStatusPanel
            variant="warning"
            message="Peça ao administrador para incluí-lo na equipe de uma loja Imóveis."
          />
        </Box>
        <Button variant="outlined" fullWidth onClick={() => void logout()}>
          Sair da conta
        </Button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Escolha a imobiliária"
      description="Selecione em qual loja deseja trabalhar."
    >
      <Stack spacing={2.5}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="text" size="small" onClick={() => void logout()}>
            Sair
          </Button>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="selecionar-loja-label">Loja</InputLabel>
          <Select
            labelId="selecionar-loja-label"
            label="Loja"
            value={selectedId}
            onChange={(e) => setSelectedId(String(e.target.value))}
          >
            {accessibleStores.map((store) => (
              <MenuItem key={store.id} value={store.id}>
                {store.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!selectedId || isEntering}
          onClick={enterSelected}
          startIcon={
            isEntering ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <StoreOutlinedIcon fontSize="small" />
            )
          }
        >
          {isEntering ? 'Entrando…' : 'Continuar'}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {accessibleStores.length}{' '}
          {accessibleStores.length === 1 ? 'loja vinculada' : 'lojas vinculadas'}
        </Typography>
      </Stack>
    </AuthPageShell>
  );
}
