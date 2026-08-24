'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { Tab, Tabs, Typography } from '@citybox/mui';
import {
  BEAUTIFUL_SETTINGS_TABS,
  isSettingsTabActive,
} from '@/lib/navigation';
import {
  canAccessSettingsTab,
  firstAllowedSettingsPath,
  isAllowedSettingsPathname,
} from '@/lib/beautiful-nav-permissions';
import { useStore } from '@/lib/store-context';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';

export function SettingsSectionNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { storeId, stores, loading } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const permissions = active?.permissions ?? [];
  const isOwner = active?.isOrganizationOwner === true;

  const tabs = useMemo(
    () =>
      BEAUTIFUL_SETTINGS_TABS.filter((tab) =>
        canAccessSettingsTab(tab.id, permissions, isOwner),
      ),
    [isOwner, permissions],
  );

  const pathAllowed = isAllowedSettingsPathname(
    pathname,
    permissions,
    isOwner,
  );
  const fallbackPath = firstAllowedSettingsPath(permissions, isOwner);

  useEffect(() => {
    if (loading || tabs.length === 0) return;
    if (pathAllowed) return;
    if (fallbackPath && fallbackPath !== pathname) {
      router.replace(fallbackPath);
    }
  }, [fallbackPath, loading, pathAllowed, pathname, router, tabs.length]);

  const activeTab =
    tabs.find((tab) => isSettingsTabActive(tab.path, pathname)) ?? tabs[0];

  if (!activeTab || tabs.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={settingsMutedTextSx}>
          Nenhuma seção de configurações disponível para o seu perfil.
        </Typography>
      </Box>
    );
  }

  if (!pathAllowed) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={settingsMutedTextSx}>
          Redirecionando…
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 'auto',
        // Quebra o `p: 3` do main — faixa full-bleed no topo.
        mx: -3,
        mt: -3,
        mb: 3,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Tabs
        value={activeTab.id}
        variant="standard"
        aria-label="Seções de configurações"
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
