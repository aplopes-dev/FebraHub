'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Drawer, FormField, SearchInput } from '@citybox/mui/molecules';
import { ConfirmationDialog } from '@citybox/mui/organisms';
import { Icon } from '@citybox/mui/icons';
import { COMMON_UNITS_OF_MEASURE } from '../data/mock-catalog';
import type { ProductFormData, ProductItem } from '../types/catalog.types';

const DRAWER_WIDTH = 680;

export type StockEntryStep = 'select-option' | 'new-product' | 'add-quantity';
export type StockEntryOption = 'new-product' | 'existing-product';

export interface ProductQuantityEntry {
  productId: string;
  quantity: number;
}

export type StockEntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSubmitProduct: (data: ProductFormData) => void;
  onBulkAddStock: (entries: ProductQuantityEntry[]) => void;
  products: ProductItem[];
  productToEdit?: ProductItem | null;
  loading?: boolean;
};

/* ── STEP 1: Seletor de Opção ── */
function StepSelectOption({
  selectedOption,
  onSelectOption,
}: {
  selectedOption: StockEntryOption | null;
  onSelectOption: (option: StockEntryOption) => void;
}) {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ButtonBase
            onClick={() => onSelectOption('new-product')}
            sx={{
              width: '100%',
              p: 3,
              borderRadius: 2.5,
              border: '2px solid',
              borderColor: selectedOption === 'new-product' ? 'primary.main' : 'divider',
              bgcolor: selectedOption === 'new-product' ? 'action.selected' : 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: selectedOption === 'new-product' ? 'primary.main' : 'action.active',
                bgcolor: selectedOption === 'new-product' ? 'action.selected' : 'action.hover',
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: selectedOption === 'new-product' ? 'primary.main' : 'action.hover',
                color: selectedOption === 'new-product' ? 'primary.contrastText' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="package" size={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                É um produto que eu não tenho cadastrado
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cadastrar um novo produto do zero no estoque
              </Typography>
            </Box>
          </ButtonBase>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <ButtonBase
            onClick={() => onSelectOption('existing-product')}
            sx={{
              width: '100%',
              p: 3,
              borderRadius: 2.5,
              border: '2px solid',
              borderColor: selectedOption === 'existing-product' ? 'primary.main' : 'divider',
              bgcolor: selectedOption === 'existing-product' ? 'action.selected' : 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: selectedOption === 'existing-product' ? 'primary.main' : 'action.active',
                bgcolor: selectedOption === 'existing-product' ? 'action.selected' : 'action.hover',
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: selectedOption === 'existing-product' ? 'primary.main' : 'action.hover',
                color: selectedOption === 'existing-product' ? 'primary.contrastText' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="boxes" size={28} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                É um produto que eu já tenho cadastrado
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Aumentar a quantidade de produtos no estoque
              </Typography>
            </Box>
          </ButtonBase>
        </Grid>
      </Grid>
    </Stack>
  );
}

/* ── STEP 2: Novo Produto ou Edição ── */
function StepNewProduct({
  productToEdit,
  formData,
  onFormDataChange,
  loading = false,
}: {
  productToEdit?: ProductItem | null;
  formData: ProductFormData;
  onFormDataChange: (data: Partial<ProductFormData>) => void;
  loading?: boolean;
}) {
  const isEditMode = Boolean(productToEdit);

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <FormField
            label="Nome do Produto *"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            placeholder="Ex: Shampoo Reconstrução Lavatório 300ml"
            fullWidth
            autoFocus
            disabled={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormField
            label="Código SKU"
            value={formData.sku}
            onChange={(e) => onFormDataChange({ sku: e.target.value.toUpperCase() })}
            placeholder="Ex: SHP-101 (opcional)"
            helperText="Opcional"
            fullWidth
            disabled={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel id="unit-of-measure-label">Unidade de Medida *</InputLabel>
            <Select
              labelId="unit-of-measure-label"
              value={formData.unitOfMeasure}
              label="Unidade de Medida *"
              onChange={(e) => onFormDataChange({ unitOfMeasure: e.target.value })}
            >
              {COMMON_UNITS_OF_MEASURE.map((unit) => (
                <MenuItem key={unit.value} value={unit.value}>
                  {unit.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField
            label="Custo Unitário de Aquisição (R$)"
            type="number"
            value={formData.costPrice ?? ''}
            onChange={(e) =>
              onFormDataChange({
                costPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              },
            }}
            fullWidth
            disabled={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField
            label={isEditMode ? 'Quantidade em Estoque' : 'Quantidade Inicial *'}
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => onFormDataChange({ stockQuantity: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">{formData.unitOfMeasure}</InputAdornment>,
              },
            }}
            fullWidth
            disabled={loading || isEditMode}
            helperText={isEditMode ? 'Para alterar a quantidade, use a ação de movimentação no estoque.' : undefined}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormField
            label="Estoque Mínimo (Alerta)"
            type="number"
            value={formData.minStockQuantity}
            onChange={(e) => onFormDataChange({ minStockQuantity: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">{formData.unitOfMeasure}</InputAdornment>,
              },
            }}
            fullWidth
            disabled={loading}
          />
        </Grid>
      </Grid>

      <FormField
        label="Descrição do Produto"
        value={formData.description ?? ''}
        onChange={(e) => onFormDataChange({ description: e.target.value })}
        placeholder="Ex: Utilizar 15ml por lavagem de cabelo quimicamente tratado..."
        multiline
        rows={3}
        fullWidth
        disabled={loading}
      />
    </Stack>
  );
}

/* ── STEP 3: Entrada em Lote de Produtos Existentes ── */
function StepAddQuantity({
  products,
  entries,
  onEntriesChange,
}: {
  products: ProductItem[];
  entries: ProductQuantityEntry[];
  onEntriesChange: (entries: ProductQuantityEntry[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower),
    );
  }, [products, searchTerm]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const existingIndex = entries.findIndex((e) => e.productId === productId);

    if (quantity <= 0) {
      onEntriesChange(entries.filter((e) => e.productId !== productId));
    } else if (existingIndex >= 0) {
      const updated = [...entries];
      updated[existingIndex] = { productId, quantity };
      onEntriesChange(updated);
    } else {
      onEntriesChange([...entries, { productId, quantity }]);
    }
  };

  const getEntryQuantity = (productId: string): number => {
    return entries.find((e) => e.productId === productId)?.quantity ?? 0;
  };

  return (
    <Stack spacing={2.5}>
      <SearchInput
        placeholder="Buscar produto por nome ou SKU..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
      />

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          maxHeight: 380,
          overflowY: 'auto',
        }}
      >
        {filteredProducts.map((product) => {
          const addedQty = getEntryQuantity(product.id);

          return (
            <Box
              key={product.id}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                '&:not(:last-child)': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                bgcolor: addedQty > 0 ? 'action.selected' : 'transparent',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Estoque atual: {product.stockQuantity} {product.unitOfMeasure}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ width: 130, flexShrink: 0 }}>
                <TextField
                  size="small"
                  label="Qtd. entrada"
                  type="number"
                  placeholder="0"
                  value={addedQty || ''}
                  onChange={(e) =>
                    handleQuantityChange(
                      product.id,
                      Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                    )
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">{product.unitOfMeasure}</InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>
          );
        })}

        {filteredProducts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhum produto encontrado.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Stack>
  );
}

/* ── COMPONENTE PRINCIPAL: StockEntryDrawer ── */
export function StockEntryDrawer({
  open,
  onClose,
  onSubmitProduct,
  onBulkAddStock,
  products,
  productToEdit,
  loading = false,
}: StockEntryDrawerProps) {
  const isEditMode = Boolean(productToEdit);
  const [step, setStep] = useState<StockEntryStep>(
    isEditMode ? 'new-product' : 'select-option',
  );
  const [selectedOption, setSelectedOption] = useState<StockEntryOption | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    unitOfMeasure: 'un',
    stockQuantity: 10,
    minStockQuantity: 5,
    costPrice: 25,
    description: '',
    active: true,
  });

  const [quantityEntries, setQuantityEntries] = useState<ProductQuantityEntry[]>([]);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setStep('new-product');
        setFormData({
          name: productToEdit.name,
          sku: productToEdit.sku,
          unitOfMeasure: productToEdit.unitOfMeasure || 'un',
          stockQuantity: productToEdit.stockQuantity,
          minStockQuantity: productToEdit.minStockQuantity,
          costPrice: productToEdit.costPrice,
          description: productToEdit.description || '',
          active: productToEdit.active,
        });
      } else {
        setStep('select-option');
        setSelectedOption(null);
        setFormData({
          name: '',
          sku: '',
          unitOfMeasure: 'un',
          stockQuantity: 10,
          minStockQuantity: 5,
          costPrice: 25,
          description: '',
          active: true,
        });
      }
      setQuantityEntries([]);
      setIsConfirmBulkOpen(false);
    }
  }, [open, productToEdit]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleContinue = () => {
    if (selectedOption === 'new-product') {
      setStep('new-product');
    } else if (selectedOption === 'existing-product') {
      setStep('add-quantity');
    }
  };

  const handleSaveProduct = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) return;
    onSubmitProduct({
      ...formData,
      name: trimmedName,
      sku: formData.sku.trim(),
    });
  };

  const handleConfirmBulkAdd = () => {
    if (quantityEntries.length === 0) return;
    onBulkAddStock(quantityEntries);
    setIsConfirmBulkOpen(false);
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name ?? productId;
  };

  const titleText = isEditMode
    ? 'Editar produto'
    : step === 'new-product'
    ? 'Cadastrar novo produto'
    : step === 'add-quantity'
    ? 'Entrada de quantidade em estoque'
    : 'Fazer entrada no estoque';

  const titleNode = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {step !== 'select-option' && !isEditMode ? (
        <IconButton
          size="small"
          onClick={() => setStep('select-option')}
          sx={{ mr: 0.5 }}
          aria-label="Voltar"
        >
          <Icon name="chevron-left" size={20} />
        </IconButton>
      ) : null}
      <Typography variant="h6" component="h2" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
        {titleText}
      </Typography>
    </Stack>
  );

  const canContinue = selectedOption !== null;
  const canSaveProduct = Boolean(formData.name.trim());
  const canSaveBulk = quantityEntries.length > 0;

  const footerNode = (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
      <Button variant="outlined" color="inherit" onClick={handleClose} disabled={loading}>
        Cancelar
      </Button>

      {step === 'select-option' ? (
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!canContinue || loading}
        >
          Continuar
        </Button>
      ) : null}

      {step === 'new-product' ? (
        <Button
          variant="contained"
          onClick={handleSaveProduct}
          disabled={!canSaveProduct || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {loading ? 'Salvando…' : isEditMode ? 'Salvar alterações' : 'Salvar produto'}
        </Button>
      ) : null}

      {step === 'add-quantity' ? (
        <Button
          variant="contained"
          onClick={() => setIsConfirmBulkOpen(true)}
          disabled={!canSaveBulk || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          Salvar entradas ({quantityEntries.length})
        </Button>
      ) : null}
    </Stack>
  );

  const subtitleText =
    step === 'select-option'
      ? 'Selecione o tipo de entrada que deseja fazer no estoque'
      : step === 'new-product'
      ? isEditMode
        ? 'Atualize as informações do produto'
        : 'Preencha os dados do novo produto no estoque'
      : 'Informe a quantidade a ser adicionada para cada produto selecionado';

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        title={titleNode}
        subtitle={subtitleText}
        footer={footerNode}
        width={DRAWER_WIDTH}
        anchor="right"
      >
        {step === 'select-option' ? (
          <StepSelectOption
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
          />
        ) : null}

        {step === 'new-product' ? (
          <StepNewProduct
            productToEdit={productToEdit}
            formData={formData}
            onFormDataChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
            loading={loading}
          />
        ) : null}

        {step === 'add-quantity' ? (
          <StepAddQuantity
            products={products}
            entries={quantityEntries}
            onEntriesChange={setQuantityEntries}
          />
        ) : null}
      </Drawer>

      <ConfirmationDialog
        open={isConfirmBulkOpen}
        onCancel={() => setIsConfirmBulkOpen(false)}
        onConfirm={handleConfirmBulkAdd}
        title="Confirmar entradas no estoque"
        confirmLabel={loading ? 'Salvando…' : 'Confirmar entradas'}
        cancelLabel="Revisar"
        confirmColor="primary"
        loading={loading}
        description={
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Revise os produtos e as quantidades que serão adicionadas ao estoque:
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              <Stack spacing={1}>
                {quantityEntries.map((entry) => (
                  <Stack
                    key={entry.productId}
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getProductName(entry.productId)}
                    </Typography>

                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                      +{entry.quantity} unid.
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        }
      />
    </>
  );
}
