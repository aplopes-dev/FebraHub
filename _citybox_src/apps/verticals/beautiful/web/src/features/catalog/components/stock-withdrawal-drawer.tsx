'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Drawer, FormField, toast } from '@citybox/mui/molecules';
import { ConfirmationDialog } from '@citybox/mui/organisms';
import { useAdjustStockMutation } from '../hooks/use-catalog-queries';
import type { ProductItem } from '../types/catalog.types';

const DRAWER_WIDTH = 520;

export type StockWithdrawalDrawerProps = {
  open: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  products?: ProductItem[];
};

export function StockWithdrawalDrawer({
  open,
  onClose,
  product = null,
  products = [],
}: StockWithdrawalDrawerProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  const adjustMutation = useAdjustStockMutation();

  const activeProduct =
    product ?? products.find((p) => p.id === selectedProductId) ?? null;

  useEffect(() => {
    if (open) {
      if (product) {
        setSelectedProductId(product.id);
      } else if (products.length > 0) {
        setSelectedProductId(products[0].id);
      } else {
        setSelectedProductId('');
      }
      setQuantity('1');
      setNote('');
      setError('');
      setIsConfirmDialogOpen(false);
    }
  }, [open, product, products]);

  const handleClose = () => {
    if (adjustMutation.isPending) return;
    onClose();
  };

  const handleOpenConfirmation = () => {
    if (!activeProduct) {
      setError('Selecione um produto.');
      return;
    }

    const qty = Number.parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      setError('Informe uma quantidade inteira maior que zero.');
      return;
    }

    if (qty > activeProduct.stockQuantity) {
      setError(
        `Estoque insuficiente. Disponível no momento: ${activeProduct.stockQuantity} ${activeProduct.unitOfMeasure}.`,
      );
      return;
    }

    setError('');
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmWithdrawal = () => {
    if (!activeProduct) return;
    const qty = Number.parseInt(quantity, 10);

    adjustMutation.mutate(
      {
        productId: activeProduct.id,
        data: { type: 'OUT', quantity: qty, note: note.trim() || undefined },
      },
      {
        onSuccess: (result) => {
          toast.success('Retirada de estoque registrada!', {
            description: `${activeProduct.name} · Novo estoque: ${result.product.stockQuantity} ${activeProduct.unitOfMeasure}`,
          });
          setIsConfirmDialogOpen(false);
          onClose();
        },
        onError: () => {
          setIsConfirmDialogOpen(false);
          toast.error('Não foi possível registrar a retirada', {
            description: 'Verifique a quantidade disponível em estoque e tente novamente.',
          });
        },
      },
    );
  };

  const parsedQty = Number.parseInt(quantity, 10);
  const isFormValid =
    Boolean(activeProduct) &&
    Number.isFinite(parsedQty) &&
    parsedQty > 0 &&
    parsedQty <= (activeProduct?.stockQuantity ?? 0);

  const titleText = 'Registrar retirada de estoque';
  const subtitleText = 'Registre a saída de produtos para uso interno, descarte ou ajuste';

  const footerNode = (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleClose}
        disabled={adjustMutation.isPending}
      >
        Cancelar
      </Button>

      <Button
        variant="contained"
        color="warning"
        onClick={handleOpenConfirmation}
        disabled={!isFormValid || adjustMutation.isPending}
        startIcon={
          adjustMutation.isPending ? (
            <CircularProgress size={18} color="inherit" />
          ) : undefined
        }
      >
        {adjustMutation.isPending ? 'Registrando…' : 'Confirmar retirada'}
      </Button>
    </Stack>
  );

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        title={titleText}
        subtitle={subtitleText}
        footer={footerNode}
        width={DRAWER_WIDTH}
        anchor="right"
      >
        <Stack spacing={3}>
          {/* Seleção do produto (se não for pré-definido) */}
          {!product && products.length > 0 ? (
            <FormControl fullWidth disabled={adjustMutation.isPending}>
              <InputLabel id="select-product-withdrawal-label">Produto *</InputLabel>
              <Select
                labelId="select-product-withdrawal-label"
                value={selectedProductId}
                label="Produto *"
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setError('');
                }}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.stockQuantity} {p.unitOfMeasure} disp.)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : activeProduct ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {activeProduct.name}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  SKU: {activeProduct.sku || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">•</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Estoque disponível: {activeProduct.stockQuantity} {activeProduct.unitOfMeasure}
                </Typography>
              </Stack>
            </Box>
          ) : null}

          {/* Quantidade a retirar */}
          <Box>
            <FormField
              label="Quantidade a retirar *"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              fullWidth
              error={Boolean(error)}
              helperText={error}
              disabled={adjustMutation.isPending}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'warning.main', fontWeight: 700 }}>
                      −
                    </InputAdornment>
                  ),
                  endAdornment: activeProduct ? (
                    <InputAdornment position="end">{activeProduct.unitOfMeasure}</InputAdornment>
                  ) : undefined,
                },
                htmlInput: { min: 1, step: 1 },
              }}
            />
          </Box>

          {/* Motivo / Observação */}
          <FormField
            label="Motivo da retirada"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Consumo interno no lavatório, produto vencido, quebrado, ajuste..."
            multiline
            minRows={3}
            fullWidth
            disabled={adjustMutation.isPending}
          />
        </Stack>
      </Drawer>

      {activeProduct ? (
        <ConfirmationDialog
          open={isConfirmDialogOpen}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleConfirmWithdrawal}
          title="Confirmar retirada de estoque?"
          confirmLabel={adjustMutation.isPending ? 'Registrando…' : 'Confirmar saída'}
          cancelLabel="Revisar"
          confirmColor="warning"
          loading={adjustMutation.isPending}
          description={
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Confira os detalhes da saída antes de confirmar a movimentação:
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Produto:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeProduct.name}</Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Quantidade a retirar:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      −{parsedQty} {activeProduct.unitOfMeasure}
                    </Typography>
                  </Stack>

                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Estoque resultante:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.max(0, activeProduct.stockQuantity - parsedQty)} {activeProduct.unitOfMeasure}
                    </Typography>
                  </Stack>

                  {note.trim() ? (
                    <Stack direction="row" sx={{ justifyContent: 'space-between', pt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Motivo:</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', maxWidth: 220, textAlign: 'right' }}>
                        "{note.trim()}"
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            </Stack>
          }
        />
      ) : null}
    </>
  );
}
