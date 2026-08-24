'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@citybox/mui/atoms';
import { Drawer, FormField } from '@citybox/mui/molecules';
import CircularProgress from '@mui/material/CircularProgress';
import { formatPhoneBR, digitsOnly } from '@/lib/field-masks';
import { CategoryColorBadge } from '@/features/settings/components/category-color-picker';
import { useClientCategoriesQuery } from '@/features/settings/hooks/use-client-categories-queries';
import type { Client, ClientFormData } from '../types/client.types';

const DRAWER_WIDTH = 800;
const NONE_CATEGORY = '__none__';

type ClientFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  clientToEdit?: Client | null;
  isSubmitting?: boolean;
};

type FormContentProps = ClientFormDrawerProps & {
  isSubmitting: boolean;
  onRenderFooter?: (footer: ReactNode) => void;
};

function ClientFormDrawerContent({
  open,
  onClose,
  onSubmit,
  clientToEdit,
  isSubmitting,
  onRenderFooter,
}: FormContentProps) {
  const isEdit = Boolean(clientToEdit);
  const { data: categories = [], isPending: loadingCategories } =
    useClientCategoriesQuery();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(formatPhoneBR(clientToEdit.phone));
      setCategoryId(clientToEdit.categoryId ?? '');
    } else {
      setName('');
      setPhone('');
      setCategoryId('');
    }
    setErrors({});
  }, [open, clientToEdit]);

  const formBlocked = isSubmitting;

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (name.trim().length < 2) {
      next.name = 'Informe o nome com pelo menos 2 caracteres.';
    }

    const phoneDigits = digitsOnly(phone);
    if (phoneDigits.length < 10) {
      next.phone = 'Informe um telefone válido com DDD (mínimo 10 dígitos).';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      phone: digitsOnly(phone),
      categoryId: categoryId || null,
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  useEffect(() => {
    onRenderFooter?.(
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleClose}
          disabled={formBlocked}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={formBlocked}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {isSubmitting
            ? isEdit
              ? 'Salvando…'
              : 'Cadastrando…'
            : isEdit
              ? 'Salvar alterações'
              : 'Cadastrar cliente'}
        </Button>
      </Stack>,
    );
  });

  return (
    <Stack spacing={2.5}>
      <FormField
        label="Nome *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={Boolean(errors.name)}
        errorMessage={errors.name}
        fullWidth
        autoFocus
        disabled={formBlocked}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label="Celular / WhatsApp *"
          value={phone}
          onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
          error={Boolean(errors.phone)}
          errorMessage={errors.phone}
          fullWidth
          disabled={formBlocked}
        />

        <FormControl fullWidth disabled={loadingCategories || formBlocked}>
          <InputLabel id="client-category-label">Categoria</InputLabel>
          <Select
            labelId="client-category-label"
            label="Categoria"
            value={categoryId || NONE_CATEGORY}
            onChange={(e) => {
              const next = String(e.target.value);
              setCategoryId(next === NONE_CATEGORY ? '' : next);
            }}
          >
            <MenuItem value={NONE_CATEGORY}>Sem categoria</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CategoryColorBadge colorId={category.colorId} />
                  <Typography variant="body2">{category.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}

export function ClientFormDrawer(props: ClientFormDrawerProps) {
  const { open, onClose, isSubmitting = false, clientToEdit } = props;
  const [footerNode, setFooterNode] = useState<ReactNode>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const title = clientToEdit ? 'Editar cliente' : 'Novo cliente';

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={title}
      footer={footerNode}
      width={DRAWER_WIDTH}
      anchor="right"
    >
      {open ? (
        <ClientFormDrawerContent
          {...props}
          isSubmitting={isSubmitting}
          onRenderFooter={setFooterNode}
        />
      ) : null}
    </Drawer>
  );
}
