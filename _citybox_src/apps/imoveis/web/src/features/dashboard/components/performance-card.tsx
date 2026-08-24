'use client';

import dynamic from 'next/dynamic';
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { Panel, PanelHeader } from '@/components/ui/panel';
import type { PerformancePeriod, PerformanceSeries } from '../types';

const PerformanceChart = dynamic(() => import('./performance-chart'), {
  ssr: false,
  loading: () => (
    <Skeleton variant="rounded" sx={{ width: '100%', height: '100%', borderRadius: '16px' }} />
  ),
});

const PERIOD_LABEL: Record<PerformancePeriod, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

type PerformanceCardProps = {
  series: PerformanceSeries | undefined;
  period: PerformancePeriod;
  onPeriodChange: (period: PerformancePeriod) => void;
  isLoading?: boolean;
};

export function PerformanceCard({
  series,
  period,
  onPeriodChange,
  isLoading,
}: PerformanceCardProps) {
  return (
    <Panel
      sx={{
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        gap: 2.5,
        px: 2.5,
        py: 1.5,
      }}
    >
      <Box>
        <PanelHeader
          title="Desempenho"
          action={
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={period}
                inputProps={{ 'aria-label': 'Período de desempenho' }}
                onChange={(event) =>
                  onPeriodChange(String(event.target.value) as PerformancePeriod)
                }
                sx={{
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiSelect-select': { py: 1.25, pl: 2, pr: 4 },
                }}
              >
                {Object.entries(PERIOD_LABEL).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          }
        />

        <Stack
          component="ul"
          direction="row"
          spacing={1.5}
          sx={{ listStyle: 'none', m: 0, mt: 1, p: 0, alignItems: 'center' }}
        >
          <Stack component="li" direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--chart-revenue)' }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 300 }}>Receita</Typography>
          </Stack>
          <Stack component="li" direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--chart-visit)' }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 300 }}>Visitas</Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ minHeight: 240, flex: 1 }}>
        {isLoading || !series ? (
          <Skeleton
            variant="rounded"
            sx={{ width: '100%', height: '100%', minHeight: 240, borderRadius: '16px' }}
          />
        ) : (
          <PerformanceChart series={series} />
        )}
      </Box>
    </Panel>
  );
}
