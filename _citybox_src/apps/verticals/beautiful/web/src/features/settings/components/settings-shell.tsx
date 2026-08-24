'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import { Typography } from '@citybox/mui';
import { SettingsSectionNav } from '@/features/settings/components/settings-section-nav';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';
import { isAllowedSettingsPathname } from '@/lib/beautiful-nav-permissions';
import { useStore } from '@/lib/store-context';

type SettingsShellProps = {
  children: ReactNode;
  sectionTitle?: string;
  description?: string;
  actions?: ReactNode;
};

export function SettingsShell({
  children,
  sectionTitle,
  description,
  actions,
}: SettingsShellProps) {
  const pathname = usePathname();
  const { storeId, stores } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const pathAllowed = isAllowedSettingsPathname(
    pathname,
    active?.permissions ?? [],
    active?.isOrganizationOwner === true,
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
      }}
    >
      <SettingsSectionNav />
      {pathAllowed ? (
        <>
          {sectionTitle || description || actions ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                mb: 1.5,
              }}
            >
              {sectionTitle || description ? (
                <Box sx={{ minWidth: 0, flex: '1 1 240px' }}>
                  {sectionTitle ? (
                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {sectionTitle}
                    </Typography>
                  ) : null}
                  {description ? (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: sectionTitle ? 0.5 : 0,
                        ...settingsMutedTextSx,
                      }}
                    >
                      {description}
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Box />
              )}
              {actions}
            </Box>
          ) : null}
          {children}
        </>
      ) : null}
    </Box>
  );
}
