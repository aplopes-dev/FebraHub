'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { FormField } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import { formatPhoneBR, digitsOnly } from '@/lib/field-masks';
import { useClientCategoriesQuery } from '@/features/settings/hooks/use-client-categories-queries';
import type { Client, ClientFormData } from '../types/client.types';

type ClientFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  clientToEdit?: Client | null;
};

type FormContentProps = {
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  clientToEdit?: Client | null;
};

function ClientFormContent({
  onClose,
  onSubmit,
  clientToEdit,
}: FormContentProps) {
  const isEditing = Boolean(clientToEdit);
  const { data: categories = [] } = useClientCategoriesQuery();

  const [name, setName] = useState(clientToEdit?.name || '');
  const [phone, setPhone] = useState(
    clientToEdit?.phone ? formatPhoneBR(clientToEdit.phone) : '',
  );
  const [categoryId, setCategoryId] = useState(clientToEdit?.categoryId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Por favor, informe o nome do cliente (mínimo 2 caracteres).';
    }

    const phoneDigits = digitsOnly(phone);
    if (!phoneDigits) {
      newErrors.phone = 'Por favor, informe o telefone/WhatsApp de contato.';
    } else if (phoneDigits.length < 10) {
      newErrors.phone =
        'Por favor, informe um telefone válido com DDD (mínimo 10 dígitos).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      categoryId: categoryId || null,
    });
  };

  return (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Icon name="user" size={24} sx={{ color: 'primary.main' }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <FormField
            label="Nome *"
            placeholder="Ex: Maria Souza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
          />

          <FormField
            label="Telefone / WhatsApp *"
            placeholder="(73) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="client-category-label">Categoria</InputLabel>
            <Select
              labelId="client-category-label"
              label="Categoria"
              value={categoryId}
              onChange={(e) => setCategoryId(String(e.target.value))}
            >
              <MenuItem value="">
                <em>Sem categoria</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </Button>
      </DialogActions>
    </>
  );
}

export function ClientFormDialog({
  open,
  onClose,
  onSubmit,
  clientToEdit,
}: ClientFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open ? (
        <ClientFormContent
          key={clientToEdit?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          clientToEdit={clientToEdit}
        />
      ) : null}
    </Dialog>
  );
}
