'use client';

import type { ReactNode } from 'react';
import { Card, type CardProps } from '@citybox/mui/atoms';

type DashboardPanelProps = CardProps & {
  children: ReactNode;
};

/** Superfície padrão dos blocos do painel (borda, raio e sombra do tema). */
export function DashboardPanel({ children, sx, ...props }: DashboardPanelProps) {
  return (
    <Card
      elevation={0}
      sx={[
        (theme) => ({
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: `0 1px 2px ${theme.palette.action.hover}, 0 8px 24px -12px ${theme.palette.primary.dark}24`,
          bgcolor: 'background.paper',
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Card>
  );
}
