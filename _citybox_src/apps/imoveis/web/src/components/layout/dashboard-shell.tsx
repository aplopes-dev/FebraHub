'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Stack } from '@citybox/mui/atoms';
import { AuthLogoutGate, useRequireAuth } from '@/components/auth/auth-logout-gate';
import { DashboardPermissionGuard } from '@/components/layout/permission-gate';
import { SettingsBootstrap } from '@/features/settings/components/settings-bootstrap';
import { SettingsFirstLoginDialog } from '@/features/settings/components/settings-first-login-dialog';
import { IMOVEL_VIEW_PERMISSION } from '@/lib/vertical-permissions';
import { usePermissions } from '@/lib/permissions-context';
import { useStore } from '@/lib/store-context';
import { PAGE_SCROLL_CLASS } from '@/lib/scroll';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { DashboardHeader } from './dashboard-header';
import { NewLeadNotificationsListener } from '@/features/reminders/components/new-lead-notifications-listener';

const CONTENT_GUTTER = { xs: 1.5, sm: 2, md: 2.5 } as const;

function DashboardShellInner({ children }: { children: ReactNode }) {
  useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { storeId, loading: storeLoading } = useStore();

  useEffect(() => {
    if (permissionsLoading || storeLoading) return;
    if (!hasPermission(IMOVEL_VIEW_PERMISSION)) {
      router.replace('/login?error=no_vertical_access');
      return;
    }
    if (!storeId && !pathname.startsWith('/selecionar-loja')) {
      router.replace('/selecionar-loja');
    }
  }, [
    hasPermission,
    pathname,
    permissionsLoading,
    router,
    storeId,
    storeLoading,
  ]);

  if (permissionsLoading || storeLoading) {
    return <AuthLoadingShell message="Carregando permissões…" />;
  }

  if (!storeId) {
    return <AuthLoadingShell message="Selecionando loja…" />;
  }

  return (
    <AuthLogoutGate>
      <Box
        data-imoveis-dashboard=""
        sx={{
          height: '100svh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          // Safe area (iOS notch / home indicator)
          pt: 'env(safe-area-inset-top, 0px)',
          pb: 'env(safe-area-inset-bottom, 0px)',
          pl: 'env(safe-area-inset-left, 0px)',
          pr: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <Stack
          sx={{
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            pt: CONTENT_GUTTER,
          }}
        >
          <Box
            sx={{
              mx: 'auto',
              width: '100%',
              maxWidth: 1440,
              px: CONTENT_GUTTER,
              flexShrink: 0,
            }}
          >
            <DashboardHeader />
          </Box>

          <Box
            component="main"
            className={PAGE_SCROLL_CLASS}
            sx={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: 'auto',
              scrollbarGutter: { xs: 'auto', md: 'stable' },
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Box
              sx={{
                mx: 'auto',
                display: 'flex',
                // Só minHeight: conteúdo cresce e o <main> rola (sem fill interno).
                minHeight: '100%',
                width: '100%',
                maxWidth: 1440,
                flexDirection: 'column',
                px: CONTENT_GUTTER,
                pb: { xs: 1.5, sm: 2, md: 2.5 },
              }}
            >
              <DashboardPermissionGuard>{children}</DashboardPermissionGuard>
            </Box>
          </Box>
        </Stack>
        <SettingsBootstrap />
        <SettingsFirstLoginDialog />
        <NewLeadNotificationsListener />
      </Box>
    </AuthLogoutGate>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return <DashboardShellInner>{children}</DashboardShellInner>;
}
