'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import { Typography } from '@citybox/mui';
import { CatalogSectionNav } from '@/features/catalog/components/catalog-section-nav';
import { isAllowedCatalogPathname } from '@/lib/beautiful-nav-permissions';
import { useStore } from '@/lib/store-context';

type CatalogShellProps = {
  children: ReactNode;
  /** Título da seção ativa (abaixo da nav horizontal). */
  sectionTitle?: string;
  actions?: ReactNode;
};

export function CatalogShell({
  children,
  sectionTitle,
  actions,
}: CatalogShellProps) {
  const pathname = usePathname();
  const { storeId, stores } = useStore();
  const active = stores.find((s) => s.id === storeId);
  const pathAllowed = isAllowedCatalogPathname(
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
      <CatalogSectionNav />
      {pathAllowed ? (
        <>
          {sectionTitle || actions ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sectionTitle ? 'space-between' : 'flex-end',
                gap: 2,
                mb: 1.5,
              }}
            >
              {sectionTitle ? (
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {sectionTitle}
                </Typography>
              ) : null}
              {actions}
            </Box>
          ) : null}
          {children}
        </>
      ) : null}
    </Box>
  );
}
