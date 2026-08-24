'use client';

import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { Panel, PanelAction, PanelHeader } from '@/components/ui/panel';
import { formatNumber } from '@/features/shared/utils/format';
import { primaryHorizontalGradient } from '@/theme/accent-styles';
import type { DealsSummary } from '../types';

export function DealsCard({ deals }: { deals: DealsSummary }) {
  const total = deals.closed + deals.inProgress;
  const closedPercent = total === 0 ? 0 : Math.round((deals.closed / total) * 100);
  const progressPercent = 100 - closedPercent;

  return (
    <Panel sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PanelHeader
        title="Negócios"
        action={<PanelAction label="Ver negócios" icon="chevron" href="/transactions" />}
      />

      <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
        <Stack
          direction="row"
          spacing={0.125}
          role="img"
          aria-label={`${closedPercent}% dos negócios fechados`}
          sx={{ alignItems: 'stretch', width: '100%', minWidth: 0 }}
        >
          {closedPercent > 0 ? (
            <Box
              sx={{
                flex: `${closedPercent} 1 0`,
                minWidth: 0,
                height: 48,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'primary.light',
                background: (theme) => primaryHorizontalGradient(theme),
              }}
            />
          ) : null}
          {progressPercent > 0 ? (
            <Box
              sx={{
                flex: `${progressPercent} 1 0`,
                minWidth: 0,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'secondary.main',
                overflow: 'hidden',
                backgroundImage:
                  'repeating-linear-gradient(122deg, transparent, transparent 6px, rgba(42,45,53,0.06) 6px, rgba(42,45,53,0.06) 10px)',
              }}
            />
          ) : null}
          {total === 0 ? (
            <Box
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                height: 48,
                borderRadius: '12px',
                bgcolor: 'secondary.main',
              }}
            />
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 1.5, alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Box>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}>
              {formatNumber(deals.closed)}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 300 }}>
              Negócios fechados
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}>
              {formatNumber(deals.inProgress)}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 300 }}>
              Em andamento
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Panel>
  );
}
