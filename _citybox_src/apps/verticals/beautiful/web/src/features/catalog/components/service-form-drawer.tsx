'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Drawer, FormField, MultiSelect, type MultiSelectOption } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import {
  formatCurrencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from '@/lib/field-masks';
import { PREDEFINED_CATEGORIES } from '../data/mock-catalog';
import type { ServiceItem, ServiceFormData } from '../types/catalog.types';

const CATEGORY_OPTIONS: MultiSelectOption[] = PREDEFINED_CATEGORIES.map((cat) => ({
  value: cat,
  label: cat,
}));

type ServiceFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  serviceToEdit?: ServiceItem | null;
  isSubmitting?: boolean;
};

type FormContentProps = {
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  serviceToEdit?: ServiceItem | null;
  isSubmitting?: boolean;
};

function ServiceSheetSection({
  title,
  bordered = false,
  children,
}: {
  title?: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        pt: bordered ? 3 : 0,
        mt: bordered ? 3 : 0,
        borderTop: bordered ? '1px solid' : 'none',
        borderColor: 'divider',
      }}
    >
      {title ? (
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
        >
          {title}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

function ServiceFormContent({
  onClose,
  onSubmit,
  serviceToEdit,
  isSubmitting,
}: FormContentProps) {
  const isEditing = Boolean(serviceToEdit);

  const [name, setName] = useState(serviceToEdit?.name || '');
  const [categories, setCategories] = useState<string[]>(
    serviceToEdit?.categories || [],
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    serviceToEdit?.durationMinutes || 45,
  );
  const [price, setPrice] = useState<string>(
    serviceToEdit ? formatCurrencyInput(serviceToEdit.price) : '',
  );
  const [description, setDescription] = useState(serviceToEdit?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'O nome do serviço é obrigatório.';
    if (categories.length === 0) {
      newErrors.categories = 'Selecione ao menos uma categoria.';
    }
    const priceNum = parseCurrencyInput(price);
    if (priceNum <= 0) newErrors.price = 'Informe um preço maior que zero.';
    if (durationMinutes <= 0) {
      newErrors.durationMinutes = 'Duração deve ser maior que zero.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      categories,
      durationMinutes: Number(durationMinutes),
      price: parseCurrencyInput(price),
      description: description.trim() || undefined,
      active: serviceToEdit ? serviceToEdit.active : true,
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={isEditing ? 'edit' : 'clock'} size={22} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isEditing ? 'Editar serviço' : 'Novo serviço'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditing
                ? 'Atualize as informações cadastrais do serviço.'
                : 'Cadastre os dados do serviço.'}
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small">
          <Icon name="close" size={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        <ServiceSheetSection title="Dados do serviço">
          <Stack spacing={2.5}>
            <FormField
              label="Nome do serviço *"
              placeholder="Ex: Corte Masculino & Barba"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <MultiSelect
                  label="Categorias *"
                  options={CATEGORY_OPTIONS}
                  value={categories}
                  onChange={(newValues) => setCategories(newValues)}
                  placeholder="Selecione as categorias..."
                  errorMessage={errors.categories}
                  fullWidth
                  limitTags={1}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormField
                  label="Duração estimada *"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">min</InputAdornment>
                      ),
                    },
                  }}
                  error={Boolean(errors.durationMinutes)}
                  helperText={errors.durationMinutes}
                  fullWidth
                />
              </Grid>
            </Grid>

            <FormField
              label="Preço de venda (R$) *"
              value={price}
              onChange={(e) => setPrice(maskCurrencyInput(e.target.value))}
              placeholder="0,00"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                },
              }}
              error={Boolean(errors.price)}
              helperText={errors.price}
              fullWidth
            />

            <FormField
              label="Descrição do serviço"
              placeholder="Detalhes dos procedimentos incluídos no serviço..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </ServiceSheetSection>
      </Box>

      <Box
        sx={{
          p: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isEditing ? 'Salvar alterações' : 'Salvar serviço'}
        </Button>
      </Box>
    </Box>
  );
}

export function ServiceFormDrawer({
  open,
  onClose,
  onSubmit,
  serviceToEdit,
  isSubmitting,
}: ServiceFormDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} width={800}>
      {open ? (
        <ServiceFormContent
          key={serviceToEdit?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          serviceToEdit={serviceToEdit}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </Drawer>
  );
}
