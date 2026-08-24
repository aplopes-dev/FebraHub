'use client';

import { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Drawer } from '@citybox/mui/molecules';
import { DataTable, type DataTableColumn } from '@citybox/mui/organisms';
import { Icon } from '@citybox/mui/atoms';
import {
  useAllStockMovementsQuery,
  useProductsQuery,
} from '../hooks/use-catalog-queries';
import type {
  PaginatedStockMovementItem,
  ProductItem,
} from '../types/catalog.types';

const DRAWER_WIDTH = 780;
const ITEMS_PER_PAGE = 20;

export type StockWithdrawalHistoryDrawerProps = {
  open: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  products?: ProductItem[];
};

export function StockWithdrawalHistoryDrawer({
  open,
  onClose,
  product = null,
  products: providedProducts = [],
}: StockWithdrawalHistoryDrawerProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(product?.id ?? 'ALL');
  const [movementType, setMovementType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [page, setPage] = useState<number>(1);

  const { data: productsResult } = useProductsQuery({ page: 1, perPage: 100 });
  const fetchedProducts = productsResult?.data ?? [];
  const products = providedProducts.length > 0 ? providedProducts : fetchedProducts;

  // Atualiza estados ao abrir ou trocar produto recebido por prop
  useEffect(() => {
    if (open) {
      setSelectedProductId(product?.id ?? 'ALL');
      setPage(1);
    }
  }, [open, product]);

  const handleProductChange = (val: string) => {
    setSelectedProductId(val);
    setPage(1);
  };

  const handleTypeChange = (val: 'ALL' | 'IN' | 'OUT') => {
    setMovementType(val);
    setPage(1);
  };

  // Consulta paginada à API (disparada apenas quando open === true)
  const { data: movementsData, isPending: isLoading } = useAllStockMovementsQuery(
    {
      page,
      limit: ITEMS_PER_PAGE,
      productId: selectedProductId,
      type: movementType,
    },
    open,
  );

  const movements = movementsData?.items ?? [];
  const meta = movementsData?.meta ?? { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 };

  const columns: DataTableColumn<PaginatedStockMovementItem>[] = [
    {
      id: 'createdAt',
      header: 'Data / Hora',
      render: (row) => {
        const date = new Date(row.createdAt);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const formattedTime = date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formattedDate}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formattedTime}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: 'productName',
      header: 'Produto',
      render: (row) => (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: row.type === 'IN' ? 'success.light' : 'warning.light',
              color: 'white',
              width: 36,
              height: 36,
            }}
          >
            <Icon name={row.type === 'IN' ? 'plus' : 'minus'} size={18} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {row.productName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SKU: {row.productSku || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      id: 'quantity',
      header: 'Tipo / Qtd.',
      render: (row) => {
        const isEntry = row.type === 'IN';
        return (
          <Chip
            label={`${isEntry ? '+' : '−'} ${row.quantity} ${row.unitOfMeasure}`}
            size="small"
            color={isEntry ? 'success' : 'warning'}
            variant="filled"
            sx={{ fontWeight: 700, borderRadius: '4px' }}
          />
        );
      },
    },
    {
      id: 'note',
      header: 'Motivo / Observação',
      render: (row) => (
        <Typography
          variant="body2"
          color={row.note ? 'text.primary' : 'text.disabled'}
          sx={{ fontStyle: row.note ? 'normal' : 'italic' }}
        >
          {row.note || 'Sem observação'}
        </Typography>
      ),
    },
  ];

  const footerNode = (
    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
      <Button variant="outlined" color="inherit" onClick={onClose}>
        Fechar
      </Button>
    </Stack>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Histórico de Movimentações"
      subtitle="Consulta paginada de entradas e saídas de estoque da loja"
      footer={footerNode}
      width={DRAWER_WIDTH}
      anchor="right"
    >
      <Stack spacing={3}>
        {/* Filtros de busca na API */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-product-history-label">Produto</InputLabel>
              <Select
                labelId="filter-product-history-label"
                value={selectedProductId}
                label="Produto"
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <MenuItem value="ALL">Todos os produtos</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-type-history-label">Tipo</InputLabel>
              <Select
                labelId="filter-type-history-label"
                value={movementType}
                label="Tipo"
                onChange={(e) => handleTypeChange(e.target.value as 'ALL' | 'IN' | 'OUT')}
              >
                <MenuItem value="ALL">Todas</MenuItem>
                <MenuItem value="IN">Entradas (+)</MenuItem>
                <MenuItem value="OUT">Saídas (−)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Tabela ou Estado de Carregamento */}
        {isLoading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Carregando movimentações da API...
            </Typography>
          </Box>
        ) : movements.length === 0 ? (
          <Box
            sx={{
              py: 8,
              px: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                mx: 'auto',
                mb: 1.5,
                bgcolor: 'action.disabledBackground',
                color: 'text.secondary',
              }}
            >
              <Icon name="history" size={24} />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Nenhuma movimentação encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              As movimentações de estoque registradas serão exibidas aqui.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            <DataTable<PaginatedStockMovementItem>
              columns={columns}
              rows={movements}
              getRowId={(row) => row.id}
            />

            {/* Barra de Paginação Server-side */}
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justify: 'space-between',
                alignItems: 'center',
                pt: 1,
                px: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Exibindo página {meta.page} de {meta.totalPages} ({meta.total} movimentações)
              </Typography>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <IconButton
                  size="small"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  aria-label="Página anterior"
                >
                  <Icon name="chevron-left" size={18} />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 600, px: 1 }}>
                  {page}
                </Typography>
                <IconButton
                  size="small"
                  disabled={page >= meta.totalPages || isLoading}
                  onClick={() => setPage((prev) => prev + 1)}
                  aria-label="Próxima página"
                >
                  <Icon name="chevron-right" size={18} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
