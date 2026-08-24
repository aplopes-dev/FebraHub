'use client';

import type { ReactNode } from 'react';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CircularProgress from '@mui/material/CircularProgress';
import { Box, Stack, Typography } from '@citybox/mui/atoms';

export type AuthStatusVariant = 'loading' | 'success' | 'warning' | 'error';

type AuthStatusPanelProps = {
  variant: AuthStatusVariant;
  message: string;
};

const variantStyles: Record<
  AuthStatusVariant,
  { bgcolor: string; color: string; borderColor: string }
> = {
  loading: {
    bgcolor: 'secondary.main',
    color: 'text.secondary',
    borderColor: 'divider',
  },
  success: {
    bgcolor: 'success.light',
    color: 'success.dark',
    borderColor: 'success.main',
  },
  warning: {
    bgcolor: 'warning.light',
    color: 'warning.dark',
    borderColor: 'warning.main',
  },
  error: {
    bgcolor: 'error.light',
    color: 'error.dark',
    borderColor: 'error.main',
  },
};

function StatusIcon({ variant }: { variant: AuthStatusVariant }) {
  if (variant === 'loading') {
    return <CircularProgress size={18} aria-hidden />;
  }
  if (variant === 'success') {
    return <CheckCircleOutlinedIcon sx={{ fontSize: 20 }} aria-hidden />;
  }
  if (variant === 'warning') {
    return <WarningAmberIcon sx={{ fontSize: 20 }} aria-hidden />;
  }
  return <ErrorOutlinedIcon sx={{ fontSize: 20 }} aria-hidden />;
}

export function AuthStatusPanel({ variant, message }: AuthStatusPanelProps) {
  const styles = variantStyles[variant];
  return (
    <Box
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      sx={{
        display: 'flex',
        alignItems: variant === 'loading' ? 'center' : 'flex-start',
        gap: 1.5,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: styles.borderColor,
        bgcolor: styles.bgcolor,
        color: styles.color,
        px: 2,
        py: 1.5,
        fontSize: '0.875rem',
      }}
    >
      <StatusIcon variant={variant} />
      <span>{message}</span>
    </Box>
  );
}

type AuthPageShellProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

const DEFAULT_FOOTER = 'Acesso restrito · Somente membros autorizados';

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: '20px',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
          px: 4,
          py: 5,
        }}
      >
        <Typography
          component="h1"
          sx={{
            mb: title || description ? 3 : 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Citybox Imóveis
        </Typography>

        {title || description ? (
          <Stack spacing={0.75} sx={{ mb: 3 }}>
            {title ? (
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>{title}</Typography>
            ) : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        {children}
      </Box>

      {footer ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2.5, textAlign: 'center' }}
        >
          {footer}
        </Typography>
      ) : null}
    </Box>
  );
}

type AuthLoadingShellProps = {
  message: string;
  title?: string;
  description?: string;
};

export function AuthLoadingShell({
  message,
  title = 'Acesso ao painel',
  description,
}: AuthLoadingShellProps) {
  return (
    <AuthPageShell title={title} description={description}>
      <AuthStatusPanel variant="loading" message={message} />
    </AuthPageShell>
  );
}
