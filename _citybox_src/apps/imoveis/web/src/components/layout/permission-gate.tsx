'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { Panel } from '@/components/ui/panel';
import { useAuthSession } from '@/lib/session-context';
import { useSessionPermissions } from '@/features/settings/hooks/use-session-permissions';
import { PERMISSION_LABEL, type PermissionKey } from '@/features/settings/types';

type PermissionGateByFlagProps = {
  allowed: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  permission?: never;
  redirectTo?: never;
  redirect?: never;
};

type PermissionGateByKeyProps = {
  permission: PermissionKey;
  children: ReactNode;
  redirectTo?: string;
  redirect?: boolean;
  allowed?: never;
  fallback?: never;
};

type PermissionGateProps = PermissionGateByFlagProps | PermissionGateByKeyProps;

/** Aceita `allowed` (finance/transações) ou `permission` (settings RBAC). */
export function PermissionGate(props: PermissionGateProps) {
  if ('allowed' in props && typeof props.allowed === 'boolean') {
    if (!props.allowed) {
      return props.fallback ?? <AccessDeniedPanel />;
    }
    return props.children;
  }

  return <PermissionGateByKey {...props} />;
}

function PermissionGateByKey({
  permission,
  children,
  redirectTo = '/',
  redirect = false,
}: PermissionGateByKeyProps) {
  const { can } = useSessionPermissions();
  const router = useRouter();
  const allowed = can(permission);

  useEffect(() => {
    if (!allowed && redirect) {
      toast.error('Você não tem permissão para acessar esta área.');
      router.replace(redirectTo);
    }
  }, [allowed, redirect, redirectTo, router]);

  if (!allowed) {
    if (redirect) return null;
    return <AccessDeniedPanel permission={permission} />;
  }

  return children;
}

type AccessDeniedPanelProps = {
  permission?: PermissionKey;
  title?: string;
  description?: string;
};

export function AccessDeniedPanel({
  permission,
  title = 'Acesso restrito',
  description,
}: AccessDeniedPanelProps) {
  const router = useRouter();
  const message =
    description ??
    (permission
      ? `Seu usuário não tem permissão para acessar “${PERMISSION_LABEL[permission]}”. Peça ao administrador para habilitar.`
      : 'Você não tem permissão para ver ou editar este conteúdo.');

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }

  return (
    <Panel
      sx={{
        display: 'flex',
        minHeight: 320,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: 'error.light',
          color: 'error.main',
        }}
      >
        <GppBadOutlinedIcon sx={{ fontSize: 20 }} />
      </Box>
      <Stack spacing={0.5} sx={{ maxWidth: 448 }}>
        <Typography
          component="h2"
          sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.025em' }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
      <Button
        type="button"
        variant="outlined"
        color="inherit"
        startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />}
        onClick={handleBack}
        sx={{ mt: 1, borderRadius: '999px', px: 2.5 }}
      >
        Voltar
      </Button>
    </Panel>
  );
}

/** Bloqueia o conteúdo da rota sem sair da URL — só mostra acesso negado. */
export function DashboardPermissionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { canPath } = useSessionPermissions();
  const { status } = useAuthSession();

  const allowed = status === 'authenticated' ? canPath(pathname) : canPath(pathname);

  if (!allowed) {
    return (
      <AccessDeniedPanel
        title="Acesso restrito"
        description="Seu usuário não tem permissão para esta página. Peça ao administrador para habilitar."
      />
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      {children}
    </Box>
  );
}
