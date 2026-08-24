'use client';

import type { ComponentType } from 'react';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import { TrendBadge } from '@/components/ui/trend-badge';
import { Panel } from '@/components/ui/panel';
import type { DashboardMetric, MetricKey } from '../types';

const METRIC_ICON: Record<MetricKey, ComponentType<SvgIconProps>> = {
  'active-leads': PeopleOutlinedIcon,
  'total-revenue': PaymentsOutlinedIcon,
  'active-listings': HomeWorkOutlinedIcon,
  'total-closed': HandshakeOutlinedIcon,
};

export function MetricsOverview({ metrics }: { metrics: readonly DashboardMetric[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          xl: 'repeat(4, 1fr)',
        },
      }}
    >
      {metrics.map((metric) => (
        <MetricCard key={metric.key} metric={metric} />
      ))}
    </Box>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = METRIC_ICON[metric.key];

  return (
    <Panel
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <StatIconBadge icon={Icon} size="md" circular />
        <Typography
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          {metric.label}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Typography
          component="strong"
          sx={{
            fontSize: '2rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          {metric.value}
        </Typography>
        <TrendBadge trend={metric.trend} />
      </Stack>
    </Panel>
  );
}
