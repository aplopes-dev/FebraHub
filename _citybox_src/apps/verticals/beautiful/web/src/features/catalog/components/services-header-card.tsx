'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '@citybox/mui/atoms';
import type { ServiceListStats } from '../types/catalog.types';

export type ServicesHeaderCardProps = {
  stats?: ServiceListStats | null;
  isLoading?: boolean;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function StatusLegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </Typography>
    </Stack>
  );
}

function StatusProgress({
  activeCount,
  inactiveCount,
  total,
}: {
  activeCount: number;
  inactiveCount: number;
  total: number;
}) {
  const activePercent = total > 0 ? (activeCount / total) * 100 : 0;
  const inactivePercent = total > 0 ? (inactiveCount / total) * 100 : 0;

  return (
    <Box
      sx={{
        height: 8,
        width: '100%',
        borderRadius: 4,
        bgcolor: 'action.hover',
        overflow: 'hidden',
        display: 'flex',
        gap: 0.5,
      }}
    >
      {activePercent > 0 ? (
        <Box
          sx={{
            height: '100%',
            width: `${activePercent}%`,
            bgcolor: 'success.main',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      ) : null}
      {inactivePercent > 0 ? (
        <Box
          sx={{
            height: '100%',
            width: `${inactivePercent}%`,
            bgcolor: 'text.disabled',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      ) : null}
    </Box>
  );
}

export function ServicesHeaderCard({
  stats,
  isLoading = false,
}: ServicesHeaderCardProps) {
  const totalServices = stats?.totalServices ?? 0;
  const activeCount = stats?.activeCount ?? 0;
  const inactiveCount = stats?.inactiveCount ?? 0;
  const averagePrice = stats?.averagePrice ?? 0;
  const averageDuration = stats?.averageDuration ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2.5, md: 3 }}
        divider={
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: 'none', md: 'block' } }}
          />
        }
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 260 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              width: 48,
              height: 48,
              borderRadius: 2,
            }}
          >
            <Icon name="finance" size={26} />
          </Avatar>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Preço médio
            </Typography>
            {isLoading ? (
              <Skeleton width={130} height={32} />
            ) : (
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}
              >
                {formatCurrency(averagePrice)}
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            {isLoading ? (
              <Skeleton width={140} height={24} />
            ) : (
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {totalServices} Serviços cadastrados
              </Typography>
            )}
            {isLoading ? (
              <Skeleton width={120} height={20} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Duração média {averageDuration} min
              </Typography>
            )}
          </Stack>

          {isLoading ? (
            <Skeleton variant="rounded" height={8} sx={{ borderRadius: 4 }} />
          ) : (
            <StatusProgress
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              total={totalServices}
            />
          )}

          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 3 }}
            sx={{ flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}
          >
            <StatusLegendItem
              color="success.main"
              label="Ativos"
              count={isLoading ? 0 : activeCount}
            />
            <StatusLegendItem
              color="text.disabled"
              label="Inativos"
              count={isLoading ? 0 : inactiveCount}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
