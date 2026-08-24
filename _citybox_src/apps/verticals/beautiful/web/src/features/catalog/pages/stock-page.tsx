'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Stack,
  Button,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataTable, ConfirmationDialog, type DataTableColumn } from '@citybox/mui/organisms';
import { Can, useCan } from '@/features/permissions';
import { SearchInput, toast } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { CatalogStatusBadge } from '../components/catalog-status-badge';
import { StockHeaderCard } from '../components/stock-header-card';
import {
  StockEntryDrawer,
  type ProductQuantityEntry,
} from '../components/stock-entry-drawer';
import { CatalogShell } from '../components/catalog-shell';
import { StockMovementDialog } from '../components/stock-movement-dialog';
import { StockWithdrawalHistoryDrawer } from '../components/stock-withdrawal-history-drawer';
import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useToggleProductActiveMutation,
  useDeleteProductMutation,
  useAdjustStockMutation,
  useAdjustStockBatchMutation,
} from '../hooks/use-catalog-queries';
import {
  getStockSituation,
  STOCK_SITUATION_LABELS,
  type ProductFormData,
  type ProductItem,
} from '../types/catalog.types';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function StockPage() {
  const canUpdateProduct = useCan('update', 'Product');
  const canDeleteProduct = useCan('delete', 'Product');
  const canAdjustStock = useCan('update', 'Stock');
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProductFilter, setHistoryProductFilter] = useState<ProductItem | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const queryParams = useMemo(() => {
    const search = debouncedSearchTerm.trim() || undefined;
    return { search, page, perPage };
  }, [debouncedSearchTerm, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const { data: productsPage, isPending: loadingProducts } =
    useProductsQuery(queryParams);
  const products = productsPage?.data ?? [];
  const totalProducts = productsPage?.meta.total ?? 0;
  const stats = productsPage?.stats;

  const pickerOpen = isProductFormOpen || isHistoryOpen;
  const { data: pickerPage } = useProductsQuery(
    { page: 1, perPage: 100 },
    pickerOpen,
  );
  const pickerProducts = pickerPage?.data ?? products;
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const toggleProductActiveMutation = useToggleProductActiveMutation();
  const deleteProductMutation = useDeleteProductMutation();
  const adjustStockMutation = useAdjustStockMutation();
  const adjustStockBatchMutation = useAdjustStockBatchMutation();

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = (formData: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Produto atualizado!', {
              description: `Os dados de ${formData.name} foram salvos com sucesso.`,
            });
            setIsProductFormOpen(false);
          },
          onError: () => {
            toast.error('Não foi possível atualizar o produto', {
              description: 'Tente novamente em instantes.',
            });
          },
        },
      );
    } else {
      createProductMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Produto cadastrado!', {
            description: `${formData.name} foi adicionado ao estoque.`,
          });
          setIsProductFormOpen(false);
        },
        onError: () => {
          toast.error('Não foi possível cadastrar o produto', {
            description: 'Tente novamente em instantes.',
          });
        },
      });
    }
  };

  const handleBulkAddStock = async (entries: ProductQuantityEntry[]) => {
    try {
      const items = entries.map((entry) => ({
        productId: entry.productId,
        type: 'IN' as const,
        quantity: entry.quantity,
        note: 'Entrada em lote no estoque',
      }));

      await adjustStockBatchMutation.mutateAsync(items);

      toast.success('Entrada em lote realizada!', {
        description: `${entries.length} produto(s) tiveram suas quantidades atualizadas no estoque.`,
      });
      setIsProductFormOpen(false);
    } catch {
      toast.error('Não foi possível registrar a entrada em lote', {
        description: 'Tente novamente em instantes.',
      });
    }
  };

  const handleToggleProductActive = (product: ProductItem) => {
    toggleProductActiveMutation.mutate(product.id, {
      onSuccess: (updated) => {
        toast.info(updated.active ? 'Produto ativado' : 'Produto desativado', {
          description: `${product.name} agora está ${updated.active ? 'ativo' : 'inativo'}.`,
        });
      },
      onError: () => {
        toast.error('Não foi possível alterar o status', {
          description: 'Tente novamente em instantes.',
        });
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct || deleteProductMutation.isPending) return;
    deleteProductMutation.mutate(deletingProduct.id, {
      onSuccess: () => {
        toast.success('Produto removido', {
          description: `${deletingProduct.name} foi removido do estoque.`,
        });
        setDeletingProduct(null);
      },
      onError: () => {
        toast.error('Não foi possível remover o produto', {
          description: 'Tente novamente em instantes.',
        });
      },
    });
  };

  const productColumns: DataTableColumn<ProductItem>[] = [
      {
        id: 'name',
        header: 'Produto',
        render: (row) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.light', color: 'white', width: 40, height: 40 }}>
              <Icon name="products" size={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                {row.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SKU: {row.sku}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        id: 'costPrice',
        header: 'Custo Unitário',
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {row.costPrice !== undefined
              ? `R$ ${row.costPrice.toFixed(2).replace('.', ',')}`
              : '—'}
          </Typography>
        ),
      },
      {
        id: 'stockQuantity',
        header: 'Estoque Atual',
        align: 'center',
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {row.stockQuantity}
          </Typography>
        ),
      },
      {
        id: 'situation',
        header: 'Situação',
        render: (row) => {
          const situation = getStockSituation(
            row.stockQuantity,
            row.minStockQuantity,
          );
          const color =
            situation === 'out_of_stock'
              ? 'error'
              : situation === 'low_stock'
                ? 'warning'
                : 'success';
          return (
            <Chip
              label={STOCK_SITUATION_LABELS[situation]}
              size="small"
              color={color}
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: '4px' }}
            />
          );
        },
      },
      {
        id: 'active',
        header: 'Status',
        render: (row) => <CatalogStatusBadge active={row.active} />,
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        render: (row) => (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ justifyContent: 'flex-end' }}
            onClick={(e) => e.stopPropagation()}
          >
            {canAdjustStock ? (
              <Tooltip title="Retirar do estoque">
                <IconButton
                  size="small"
                  color="warning"
                  aria-label="Retirar do estoque"
                  onClick={() => setStockProduct(row)}
                >
                  <Icon name="minus" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            <Tooltip title="Ver histórico de movimentações">
              <IconButton
                size="small"
                color="secondary"
                aria-label="Ver histórico de movimentações"
                onClick={() => {
                  setHistoryProductFilter(row);
                  setIsHistoryOpen(true);
                }}
              >
                <Icon name="history" size={18} />
              </IconButton>
            </Tooltip>

            {canUpdateProduct ? (
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Editar produto"
                  onClick={() => handleEditProduct(row)}
                >
                  <Icon name="edit" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            {canUpdateProduct ? (
              <Tooltip title={row.active ? 'Desativar' : 'Ativar'}>
                <IconButton
                  size="small"
                  color={row.active ? 'warning' : 'success'}
                  aria-label={row.active ? 'Desativar produto' : 'Ativar produto'}
                  onClick={() => handleToggleProductActive(row)}
                >
                  <Icon name={row.active ? 'close' : 'check'} size={18} />
                </IconButton>
              </Tooltip>
            ) : null}

            {canDeleteProduct ? (
              <Tooltip title="Excluir">
                <IconButton
                  size="small"
                  color="error"
                  aria-label="Excluir produto"
                  onClick={() => setDeletingProduct(row)}
                >
                  <Icon name="delete" size={18} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ];

  return (
    <CatalogShell>
      {/* 1. Header de Indicadores de Estoque */}
      <StockHeaderCard stats={stats} isLoading={loadingProducts} />

      {/* 2. Barra de Busca e Botões de Ação de Estoque */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box sx={{ width: { xs: '100%', sm: 360 } }}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar produto por nome, SKU ou unidade..."
              fullWidth
            />
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Icon name="history" size={18} />}
              onClick={() => {
                setHistoryProductFilter(null);
                setIsHistoryOpen(true);
              }}
            >
              Histórico de Movimentações
            </Button>

            <Can action="create" subject="Product">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Icon name="products" size={18} />}
                onClick={handleOpenNewProduct}
              >
                Registrar Estoque
              </Button>
            </Can>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DataTable
          rows={products}
          columns={productColumns}
          isLoading={loadingProducts}
          getRowId={(row) => row.id}
          emptyMessage="Nenhum produto de consumo encontrado no estoque."
          sx={{ flex: 1 }}
          pagination={{
            page,
            perPage,
            total: totalProducts,
            onPageChange: setPage,
            onPerPageChange: (next) => {
              setPerPage(next);
              setPage(1);
            },
            perPageOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </Paper>

      <StockEntryDrawer
        open={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSubmitProduct={handleProductSubmit}
        onBulkAddStock={handleBulkAddStock}
        products={pickerProducts}
        productToEdit={editingProduct}
        loading={
          createProductMutation.isPending ||
          updateProductMutation.isPending ||
          adjustStockMutation.isPending ||
          adjustStockBatchMutation.isPending
        }
      />

      <ConfirmationDialog
        open={Boolean(deletingProduct)}
        title="Remover Produto?"
        description={`Tem certeza que deseja remover "${deletingProduct?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Remover"
        cancelLabel="Cancelar"
        confirmColor="error"
        loading={deleteProductMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingProduct(null)}
      />

      <StockMovementDialog
        open={Boolean(stockProduct)}
        product={
          stockProduct
            ? (products.find((p) => p.id === stockProduct.id) ?? stockProduct)
            : null
        }
        onClose={() => setStockProduct(null)}
      />

      <StockWithdrawalHistoryDrawer
        open={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryProductFilter(null);
        }}
        product={historyProductFilter}
        products={pickerProducts}
      />
    </CatalogShell>
  );
}
