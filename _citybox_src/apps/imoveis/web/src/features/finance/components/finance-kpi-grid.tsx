'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Skeleton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { StatIconBadge } from '@/components/ui/stat-icon-badge';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { formatCents } from '@/features/shared/utils/format';
import {
  isSingleAgentSummary,
  type AgencyFinancialSummary,
  type SingleAgentFinancialSummary,
} from '../types';

type FinanceKpiGridProps = {
  summary: AgencyFinancialSummary | SingleAgentFinancialSummary;
  isLoading?: boolean;
};

const kpiGridSx = {
  display: 'grid',
  gap: { xs: 1.25, sm: 2 },
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(2, minmax(0, 1fr))',
    xl: 'repeat(4, minmax(0, 1fr))',
  },
  width: '100%',
  minWidth: 0,
} as const;

const kpiGridSingleSx = {
  display: 'grid',
  gap: { xs: 1.25, sm: 2 },
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
  },
  width: '100%',
  minWidth: 0,
  // Último card (lucro) ocupa a linha inteira no mobile se for ímpar-friendly.
  '& > :last-child': {
    gridColumn: { xs: '1 / -1', sm: 'auto' },
  },
} as const;

export function FinanceKpiGrid({ summary, isLoading }: FinanceKpiGridProps) {
  if (isLoading) {
    return (
      <Box sx={kpiGridSx}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={112}
            sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
          />
        ))}
      </Box>
    );
  }

  if (isSingleAgentSummary(summary)) {
    return (
      <Box sx={kpiGridSingleSx}>
        <KpiCard
          icon={TrendingUpIcon}
          label="Receitas brutas"
          value={formatCents(summary.grossRevenueCents)}
        />
        <KpiCard
          icon={MonetizationOnOutlinedIcon}
          label="Despesas"
          value={formatCents(summary.expensesCents)}
        />
        <KpiCard
          icon={HandshakeOutlinedIcon}
          label="Lucro líquido"
          value={formatCents(summary.netProfitCents)}
        />
      </Box>
    );
  }

  return (
    <Box sx={kpiGridSx}>
      <KpiCard
        icon={TrendingUpIcon}
        label="Faturamento bruto"
        value={formatCents(summary.grossRevenueCents)}
      />
      <KpiCard
        icon={AccessTimeIcon}
        label="Comissões a liberar"
        value={formatCents(summary.commissionsToReleaseCents)}
      />
      <KpiCard
        icon={MonetizationOnOutlinedIcon}
        label="Aluguéis atrasados"
        value={String(summary.overdueRentalsCount)}
      />
      <KpiCard
        icon={HandshakeOutlinedIcon}
        label="Lucro líquido est."
        value={formatCents(summary.estimatedNetProfitCents)}
      />
    </Box>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: SvgIconComponent;
  label: string;
  value: string;
}) {
  return (
    <Panel
      className="flex min-w-0 flex-col"
      sx={{
        height: '100%',
        minWidth: 0,
        gap: { xs: 1.25, sm: 1.5 },
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: { xs: '14px', sm: '20px' },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'flex-start', minWidth: 0 }}
      >
        <StatIconBadge
          icon={icon}
          size="sm"
          sx={{
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            borderRadius: { xs: '10px', sm: '16px' },
          }}
        />
        <Typography
          sx={{
            minWidth: 0,
            flex: 1,
            pt: { xs: 0.25, sm: 0.5 },
            fontWeight: 500,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            lineHeight: 1.35,
            color: 'text.secondary',
            // Até 2 linhas no mobile — evita card alto e desalinhado.
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        component="strong"
        sx={{
          mt: 'auto',
          fontWeight: 600,
          fontSize: { xs: '1.0625rem', sm: '1.25rem', md: '1.5rem' },
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          fontVariantNumeric: 'tabular-nums',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Panel>
  );
}

export function AgencyDrePanel({ summary }: { summary: AgencyFinancialSummary }) {
  const { dre } = summary;
  const rows = [
    { label: 'Receita bruta', value: dre.revenueCents },
    { label: 'Comissões pagas (corretores)', value: -dre.commissionExpensesCents },
    { label: 'Taxas de administração', value: dre.adminFeesCents },
    { label: 'Despesas operacionais', value: -dre.operatingExpensesCents },
    { label: 'Lucro líquido', value: dre.netProfitCents, highlight: true },
  ];

  return (
    <Panel
      className="flex flex-col gap-3 sm:gap-4"
      sx={{
        p: { xs: 1.75, sm: 2.5 },
        borderRadius: { xs: '14px', sm: '20px' },
        minWidth: 0,
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.125rem' } }}
      >
        DRE simplificado
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, minWidth: 0 }}>
        {rows.map((row) => (
          <Box
            component="li"
            key={row.label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: { xs: 1, sm: 2 },
              py: { xs: 0.75, sm: 0.5 },
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-child': { borderBottom: 0 },
              fontSize: { xs: 13, sm: 14 },
              fontWeight: row.highlight ? 600 : undefined,
              color: row.highlight ? 'text.primary' : 'text.secondary',
            }}
          >
            <Box
              component="span"
              sx={{ minWidth: 0, flex: 1, lineHeight: 1.35, pr: 1 }}
            >
              {row.label}
            </Box>
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {formatCents(Math.abs(row.value))}
            </Box>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}

export function LedgerTable({
  entries,
}: {
  entries: SingleAgentFinancialSummary['ledger'];
}) {
  const pagination = useClientListPagination(entries);

  return (
    <>
    <Panel
      className="overflow-hidden p-0"
      sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
    >
      <Box sx={{ width: '100%', minWidth: 0, overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{ width: '100%', minWidth: 320, fontSize: { xs: 13, sm: 14 } }}
        >
          <Box component="thead">
            <Box component="tr" sx={{ borderBottom: 1, borderColor: 'divider' }}>
              {['Data', 'Descrição', 'Valor'].map((header, i) => (
                <Box
                  key={header}
                  component="th"
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    textAlign: i === 2 ? 'right' : 'left',
                    fontWeight: 500,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {pagination.pageItems.map((entry) => (
              <Box
                key={entry.id}
                component="tr"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Box
                  component="td"
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.date}
                </Box>
                <Box
                  component="td"
                  sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, minWidth: 0 }}
                >
                  {entry.label}
                </Box>
                <Box
                  component="td"
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    textAlign: 'right',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                    color:
                      entry.type === 'income' ? 'success.main' : 'error.main',
                  }}
                >
                  {entry.type === 'expense' ? '−' : '+'}
                  {formatCents(entry.amountCents)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
      <ListifyPagination
        count={pagination.total}
        page={pagination.page}
        perPage={pagination.perPage}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
        rowsPerPageOptions={pagination.perPageOptions}
      />
    </>
  );
}
