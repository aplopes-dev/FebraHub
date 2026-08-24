'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import BarChartIcon from '@mui/icons-material/BarChart';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Skeleton, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import { formatCents } from '@/features/shared/utils/format';
import { useTransactionsReport } from '../hooks/use-transactions-report';

/** Cards de resumo na aba Negócios (totais sem filtro de período). */
export function TransactionsDealsKpiGrid() {
  const { data, isLoading, isError } = useTransactionsReport();

  if (isLoading) {
    return (
      <Box className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={128} sx={{ borderRadius: 6 }} />
        ))}
      </Box>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <Box className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DealsKpi
        icon={HandshakeOutlinedIcon}
        label="Negócios ativos"
        value={String(data.totalCount)}
      />
      <DealsKpi
        icon={TrendingUpIcon}
        label="Valor bruto"
        value={formatCents(data.totalGrossValueCents)}
      />
      <DealsKpi
        icon={MonetizationOnOutlinedIcon}
        label="Comissão total"
        value={formatCents(data.totalCommissionCents)}
      />
      <DealsKpi
        icon={BarChartIcon}
        label="Concluídos"
        value={String(data.completedCount)}
      />
    </Box>
  );
}

function DealsKpi({
  icon,
  label,
  value,
}: {
  icon: SvgIconComponent;
  label: string;
  value: string;
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <StatIconBadge icon={icon} size="sm" />
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Panel>
  );
}
