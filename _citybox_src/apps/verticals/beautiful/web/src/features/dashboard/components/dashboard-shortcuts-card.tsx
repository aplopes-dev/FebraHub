'use client';

import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import { Box, Grid, Stack, Typography } from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import type { DashboardShortcut } from '../types/dashboard.types';
import { DashboardPanel } from './dashboard-panel';

type DashboardShortcutsCardProps = {
  shortcuts: DashboardShortcut[];
};

export function DashboardShortcutsCard({ shortcuts }: DashboardShortcutsCardProps) {
  if (shortcuts.length === 0) return null;

  return (
    <DashboardPanel>
      <Box sx={{ px: 3, pt: 2.75, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
          Atalhos rápidos
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: 12.5 }}>
          Acesso direto às principais áreas da plataforma
        </Typography>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Grid container spacing={1.75}>
          {shortcuts.map((item) => (
            <Grid key={item.href} size={{ xs: 12, sm: 6, md: 4 }}>
              <ShortcutTile item={item} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardPanel>
  );
}

function ShortcutTile({ item }: { item: DashboardShortcut }) {
  return (
    <Box
      component={Link}
      href={item.href}
      sx={(theme) => ({
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        p: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.6,
        bgcolor: 'background.paper',
        transition: theme.transitions.create(['border-color', 'background-color'], {
          duration: 150,
        }),
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
        },
      })}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.25,
          bgcolor: 'primary.dark',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={16} />
      </Box>
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 13.5 }}>
          {item.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, display: 'block' }}>
          {item.description}
        </Typography>
      </Stack>
    </Box>
  );
}
