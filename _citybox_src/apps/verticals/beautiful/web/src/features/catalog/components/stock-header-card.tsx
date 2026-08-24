'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '@citybox/mui/atoms';
import type { ProductListStats } from '../types/catalog.types';

export type StockHeaderCardProps = {
  stats?: ProductListStats | null;
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

function MultiColorProgress({
  inStock,
  lowStock,
  outOfStock,
  total,
}: {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  total: number;
}) {
  const inStockPercent = total > 0 ? (inStock / total) * 100 : 0;
  const lowStockPercent = total > 0 ? (lowStock / total) * 100 : 0;
  const outOfStockPercent = total > 0 ? (outOfStock / total) * 100 : 0;

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
      {inStockPercent > 0 ? (
        <Box
          sx={{
            height: '100%',
            width: `${inStockPercent}%`,
            bgcolor: 'success.main',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      ) : null}
      {lowStockPercent > 0 ? (
        <Box
          sx={{
            height: '100%',
            width: `${lowStockPercent}%`,
            bgcolor: 'warning.main',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      ) : null}
      {outOfStockPercent > 0 ? (
        <Box
          sx={{
            height: '100%',
            width: `${outOfStockPercent}%`,
            bgcolor: 'error.main',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      ) : null}
    </Box>
  );
}

export function StockHeaderCard({ stats, isLoading = false }: StockHeaderCardProps) {
  const totalProducts = stats?.totalProducts ?? 0;
  const outOfStock = stats?.outOfStock ?? 0;
  const lowStock = stats?.lowStock ?? 0;
  const inStock = stats?.inStock ?? 0;
  const totalAssetValue = stats?.totalAssetValue ?? 0;

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
        {/* Total do Valor Ativo do Estoque */}
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
              Total do valor Ativo
            </Typography>
            {isLoading ? (
              <Skeleton width={130} height={32} />
            ) : (
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', mt: 0.25 }}
              >
                {formatCurrency(totalAssetValue)}
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

        {/* Indicadores Visuais & Barra de Progresso Multicor */}
        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            {isLoading ? (
              <Skeleton width={100} height={24} />
            ) : (
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {totalProducts} Produtos cadastrados
              </Typography>
            )}
          </Stack>

          {isLoading ? (
            <Skeleton variant="rounded" height={8} sx={{ borderRadius: 4 }} />
          ) : (
            <MultiColorProgress
              inStock={inStock}
              lowStock={lowStock}
              outOfStock={outOfStock}
              total={totalProducts}
            />
          )}

          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 3 }}
            sx={{ flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}
          >
            <StatusLegendItem
              color="success.main"
              label="Em estoque"
              count={isLoading ? 0 : inStock}
            />
            <StatusLegendItem
              color="warning.main"
              label="Estoque baixo"
              count={isLoading ? 0 : lowStock}
            />
            <StatusLegendItem
              color="error.main"
              label="Sem estoque"
              count={isLoading ? 0 : outOfStock}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
