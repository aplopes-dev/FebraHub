'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { SxProps, Theme } from '@mui/material/styles';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Paper, Stack, Typography } from '@citybox/mui/atoms';

type PanelProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  sx?: SxProps<Theme>;
};

/**
 * Superfície branca do dashboard — radius 20px e padding 20px (Figma Listify).
 */
export function Panel({ children, className, id, sx }: PanelProps) {
  return (
    <Paper
      component="section"
      id={id}
      elevation={0}
      className={className}
      sx={[
        {
          borderRadius: '20px',
          p: 2.5,
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: 'none',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}

type PanelHeaderProps = {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
};

export function PanelHeader({ title, action, className, sx }: PanelHeaderProps) {
  return (
    <Stack
      component="header"
      direction="row"
      spacing={2}
      className={className}
      sx={[
        { alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {typeof title === 'string' ? (
        <Typography
          component="h2"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>
      ) : (
        title
      )}
      {action}
    </Stack>
  );
}

type PanelActionProps = {
  label: string;
  icon?: 'arrow' | 'chevron';
  href?: string;
  className?: string;
  sx?: SxProps<Theme>;
  onClick?: () => void;
};

/** Botão discreto de "abrir" no canto do painel. */
export function PanelAction({
  label,
  icon = 'arrow',
  href,
  className,
  sx,
  onClick,
}: PanelActionProps) {
  const Icon = icon === 'arrow' ? NorthEastIcon : ChevronRightIcon;

  const actionSx: SxProps<Theme> = [
    {
      width: 32,
      height: 32,
      color: 'text.secondary',
      bgcolor: 'secondary.main',
      '&:hover': {
        bgcolor: 'secondary.dark',
        color: 'text.primary',
      },
    },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  if (href) {
    return (
      <Box
        component={Link}
        href={href}
        aria-label={label}
        className={className}
        sx={[
          {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '999px',
            textDecoration: 'none',
          },
          ...actionSx,
        ]}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
    );
  }

  return (
    <IconButton
      type="button"
      aria-label={label}
      size="small"
      onClick={onClick}
      className={className}
      sx={actionSx}
    >
      <Icon sx={{ fontSize: 18 }} />
    </IconButton>
  );
}
