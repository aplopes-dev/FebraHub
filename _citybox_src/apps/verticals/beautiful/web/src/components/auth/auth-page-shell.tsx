'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Logo } from '@citybox/mui';
import { BEAUTIFUL_THEME_PRESETS } from '@/theme/theme-presets';
import { AuthStatusPanel } from './auth-status-panel';

const BRAND_COLOR = BEAUTIFUL_THEME_PRESETS.purple.topLoaderColor;
const DEFAULT_FOOTER = 'Acesso restrito · Somente membros autorizados';

type AuthPageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer = DEFAULT_FOOTER,
}: AuthPageShellProps) {
  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        display: 'flex',
        minHeight: '100svh',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: (theme) =>
          `radial-gradient(ellipse at top, ${theme.palette.primary.main}14, transparent 55%), ${theme.palette.background.default}`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            px: 4,
            py: 5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Logo variant="full" height={32} brandColor={BRAND_COLOR} />
          </Box>

          {title || description ? (
            <Stack spacing={0.75} sx={{ mb: 3.5 }}>
              {title ? (
                <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                  {title}
                </Typography>
              ) : null}
              {description ? (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              ) : null}
            </Stack>
          ) : null}

          {children}
        </Paper>

        {footer ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}
          >
            {footer}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

type AuthLoadingShellProps = {
  message: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
};

export function AuthLoadingShell({
  message,
  title = 'Acesso ao Beautiful',
  description,
  footer,
}: AuthLoadingShellProps) {
  return (
    <AuthPageShell title={title} description={description} footer={footer}>
      <AuthStatusPanel variant="loading" message={message} />
    </AuthPageShell>
  );
}
