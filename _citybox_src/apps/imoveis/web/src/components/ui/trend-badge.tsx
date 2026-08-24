'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthEastIcon from '@mui/icons-material/SouthEast';
import { Stack, Typography } from '@citybox/mui/atoms';
import { formatNumber } from '@/features/shared/utils/format';
import type { Trend } from '@/features/shared/types';

type TrendBadgeProps = {
  trend: Trend;
  className?: string;
  sx?: SxProps<Theme>;
};

/** Pill de variação — Figma: `+ 12%` com espaço após o sinal. */
export function TrendBadge({ trend, className, sx }: TrendBadgeProps) {
  const isPositive = trend.direction === 'up';
  const Icon = isPositive ? NorthEastIcon : SouthEastIcon;
  const signal = trend.value > 0 ? '+ ' : trend.value < 0 ? '− ' : '';

  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      className={className}
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          px: 1.5,
          py: 0.5,
          bgcolor: isPositive ? 'success.light' : 'error.light',
          color: isPositive ? 'success.main' : 'error.main',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.55 }}>
        {signal}
        {formatNumber(Math.abs(trend.value))}%
      </Typography>
      <Icon sx={{ fontSize: 14 }} />
    </Stack>
  );
}
