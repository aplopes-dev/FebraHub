'use client';

import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import { DashboardPanel } from './dashboard-panel';

type DashboardFinancialCardProps = {
  totalRevenue: string;
  receivedRevenue: string;
  pendingRevenue: string;
  ticketMedio: string;
  isLoading?: boolean;
};

export function DashboardFinancialCard({
  totalRevenue,
  receivedRevenue,
  pendingRevenue,
  ticketMedio,
  isLoading = false,
}: DashboardFinancialCardProps) {
  const display = (value: string) => (isLoading ? '…' : value);

  return (
    <DashboardPanel>
      <Box sx={{ px: 3, pt: 2.75, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
          Resumo financeiro do dia
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: 12.5 }}>
          Lançamentos com vencimento hoje
        </Typography>
      </Box>

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <LedgerRow label="Receita total prevista" value={display(totalRevenue)} />
        <LedgerRow
          label="Receita realizada (recebidos)"
          value={display(receivedRevenue)}
          valueColor="success.main"
        />
        <LedgerRow
          label="Receita pendente (a receber)"
          value={display(pendingRevenue)}
          valueColor="info.main"
          last
        />
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', pt: 1.75, pb: 0.5 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
            Ticket médio por lançamento
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}
          >
            {display(ticketMedio)}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          component={Link}
          href="/financeiro/fluxo-de-caixa"
          variant="contained"
          color="primary"
          fullWidth
          endIcon={<Icon name="arrow-right" size={16} />}
          sx={{
            py: 1.35,
            borderRadius: 1.4,
            fontWeight: 600,
            fontSize: 13,
            bgcolor: 'primary.dark',
            '&:hover': { bgcolor: 'primary.main' },
          }}
        >
          Ir para o fluxo de caixa
        </Button>
      </Box>
    </DashboardPanel>
  );
}

function LedgerRow({
  label,
  value,
  valueColor,
  last = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: last ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          fontSize: 14.5,
          fontVariantNumeric: 'tabular-nums',
          color: valueColor ?? 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
