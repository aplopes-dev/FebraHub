'use client';

import Link from 'next/link';
import { alpha } from '@mui/material/styles';
import { Box, Button, Stack, Typography } from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import { DashboardPanel } from './dashboard-panel';

type DashboardStockSummaryCardProps = {
  productCount: number;
  alertCount: number;
};

export function DashboardStockSummaryCard({
  productCount,
  alertCount,
}: DashboardStockSummaryCardProps) {
  const hasAlert = alertCount > 0;

  return (
    <DashboardPanel>
      <Box sx={{ px: 3, pt: 2.75, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
          Insumos do estoque
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: 12.5 }}>
          {productCount} produtos cadastrados
        </Typography>
      </Box>

      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <StockRow label="Produtos cadastrados" value={String(productCount)} />
        <StockRow label="Estoque baixo / alerta" value={String(alertCount)} alert={hasAlert} last />
      </Box>

      <Box sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          component={Link}
          href="/catalogo/estoque"
          variant="contained"
          color="warning"
          fullWidth
          endIcon={<Icon name="arrow-right" size={16} />}
          sx={{
            py: 1.35,
            borderRadius: 1.4,
            fontWeight: 600,
            fontSize: 13,
            bgcolor: 'warning.dark',
            color: 'warning.contrastText',
            '&:hover': { bgcolor: 'warning.main' },
          }}
        >
          Gerenciar estoque
        </Button>
      </Box>
    </DashboardPanel>
  );
}

function StockRow({
  label,
  value,
  alert = false,
  last = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
  last?: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.4,
        borderBottom: last ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
        {label}
      </Typography>
      <Box
        sx={(theme) => ({
          fontWeight: alert ? 700 : 600,
          fontSize: 13.5,
          fontVariantNumeric: 'tabular-nums',
          color: alert ? 'warning.main' : 'text.primary',
          bgcolor: alert ? alpha(theme.palette.warning.main, 0.12) : 'transparent',
          px: alert ? 1.1 : 0,
          py: alert ? 0.25 : 0,
          borderRadius: 0.9,
        })}
      >
        {value}
      </Box>
    </Stack>
  );
}
