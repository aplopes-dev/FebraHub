'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { FinanceiroSectionNav } from '@/features/financeiro';
import { Can } from '@/features/permissions';

export default function FinanceiroLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Can
      action="access"
      subject="Financial"
      fallback={
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Sem permissão para acessar o financeiro.
          </Typography>
        </Box>
      }
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        <FinanceiroSectionNav />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Can>
  );
}
