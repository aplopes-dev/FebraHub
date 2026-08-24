'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { Tab, Tabs, Typography } from '@citybox/mui';
import {
  BEAUTIFUL_FINANCEIRO_TABS,
  isFinanceiroTabActive,
} from '@/lib/navigation';
import {
  canAccessFinanceiroTab,
  firstAllowedFinanceiroPath,
  isAllowedFinanceiroPathname,
} from '@/lib/beautiful-nav-permissions';
import { useStore } from '@/lib/store-context';

/**
 * Nav horizontal do Financeiro (padrão Clínica: Fluxo / Transações / Config).
 * Full-bleed no topo, alinhado a CatalogSectionNav / SettingsSectionNav.
 */
export function FinanceiroSectionNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { storeId, stores, loading } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const permissions = active?.permissions ?? [];
  const isOwner = active?.isOrganizationOwner === true;

  const tabs = useMemo(
    () =>
      BEAUTIFUL_FINANCEIRO_TABS.filter((tab) =>
        canAccessFinanceiroTab(tab.id, permissions, isOwner),
      ),
    [isOwner, permissions],
  );

  const pathAllowed = isAllowedFinanceiroPathname(
    pathname,
    permissions,
    isOwner,
  );
  const fallbackPath = firstAllowedFinanceiroPath(permissions, isOwner);

  useEffect(() => {
    if (loading || tabs.length === 0) return;
    if (pathAllowed) return;
    if (fallbackPath && fallbackPath !== pathname) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, loading, pathAllowed, pathname, router, tabs.length]);

  const activeTab =
    tabs.find((tab) => isFinanceiroTabActive(tab.path, pathname)) ?? tabs[0];

  if (!activeTab || tabs.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Nenhuma seção do financeiro disponível para o seu perfil.
        </Typography>
      </Box>
    );
  }

  if (!pathAllowed) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Redirecionando…
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 'auto',
        mx: -3,
        mt: -3,
        mb: 0,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Tabs
        value={activeTab.id}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Navegação do Financeiro"
        onChange={(_, value: string) => {
          const next = tabs.find((tab) => tab.id === value);
          if (next) router.push(next.path);
        }}
        sx={{
          minHeight: 48,
          px: 3,
          '& .MuiTabs-flexContainer': {
            justifyContent: 'flex-start',
          },
          '& .MuiTabs-indicator': { height: 2 },
          '& .MuiTab-root': {
            minHeight: 48,
            minWidth: 'auto',
            px: 2,
            mr: 1,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>
    </Box>
  );
}
