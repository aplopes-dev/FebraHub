'use client';

import { useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { FormField } from '@citybox/mui/molecules';

export type CategoryFormValues = {
  name: string;
  color: string;
};

type CategoryRow = { id: string; name: string; color: string };

type CategoryFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  category?: CategoryRow | null;
  title: string;
  loading?: boolean;
};

const DEFAULT_COLOR = '#6366f1';

function CategoryFormContent({
  onClose,
  onSubmit,
  category,
  title,
  loading = false,
}: Omit<CategoryFormDialogProps, 'open'>) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color || DEFAULT_COLOR);
  const [nameError, setNameError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Informe o nome da categoria.');
      return;
    }
    const hex = color.trim() || DEFAULT_COLOR;
    onSubmit({ name: trimmed, color: hex });
  };

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormField
            label="Nome *"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            error={Boolean(nameError)}
            helperText={nameError}
            fullWidth
            autoFocus
          />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              component="input"
              type="color"
              value={color.match(/^#[0-9A-Fa-f]{6}$/) ? color : DEFAULT_COLOR}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setColor(e.target.value)
              }
              sx={{
                width: 40,
                height: 40,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 0.25,
                bgcolor: 'background.paper',
                cursor: 'pointer',
              }}
            />
            <FormField
              label="Cor (hex)"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              fullWidth
              placeholder="#6366f1"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogActions>
    </>
  );
}

export function CategoryFormDialog({
  open,
  onClose,
  onSubmit,
  category,
  title,
  loading,
}: CategoryFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
    >
      {open ? (
        <CategoryFormContent
          key={category?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          category={category}
          title={title}
          loading={loading}
        />
      ) : null}
    </Dialog>
  );
}
