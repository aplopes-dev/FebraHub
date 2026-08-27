'use client';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import {
  AppSidebar,
  type AppSidebarProps,
} from '../../organisms/app-sidebar';

export type AppDashboardLayoutProps = {
  children: ReactNode;
  /** Props do AppSidebar (1 coluna). */
  sidebar: AppSidebarProps;
  /** Slot full-bleed do header (acima do conteúdo). */
  header?: ReactNode;
  /** Estilos do container `<main>`. */
  mainSx?: SxProps<Theme>;
};

/**
 * Layout de backoffice com sidebar de 1 coluna + header full-bleed + main.
 *
 * ```
 * [ AppSidebar ] [ Header ]
 *                [ Main   ]
 * ```
 */
export function AppDashboardLayout({
  children,
  sidebar,
  header,
  mainSx,
}: AppDashboardLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100svh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <AppSidebar {...sidebar} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {header ? (
          <Box
            component="header"
            sx={{
              flexShrink: 0,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.header',
              zIndex: 0,
            }}
          >
            {header}
          </Box>
        ) : null}
        <Box
          component="main"
          sx={[
            {
              flexGrow: 1,
              minHeight: 0,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              p: 3,
            },
            ...(Array.isArray(mainSx) ? mainSx : mainSx ? [mainSx] : []),
          ]}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
