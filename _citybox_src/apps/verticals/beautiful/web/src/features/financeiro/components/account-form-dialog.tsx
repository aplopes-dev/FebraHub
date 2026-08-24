'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { FormField } from '@citybox/mui/molecules';
import type { FinancialAccount } from '../types';

export type AccountFormValues = {
  name: string;
  type: 'cash' | 'checking' | 'savings';
  isActive: boolean;
};

type AccountFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AccountFormValues) => void;
  account?: FinancialAccount | null;
  loading?: boolean;
};

const ACCOUNT_TYPES = [
  { value: 'cash' as const, label: 'Caixa' },
  { value: 'checking' as const, label: 'Conta corrente' },
  { value: 'savings' as const, label: 'Poupança' },
];

function AccountFormContent({
  onClose,
  onSubmit,
  account,
  loading = false,
}: Omit<AccountFormDialogProps, 'open'>) {
  const isEditing = Boolean(account);
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<'cash' | 'checking' | 'savings'>(
    account?.type ?? 'checking',
  );
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [nameError, setNameError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Informe o nome da conta.');
      return;
    }
    onSubmit({ name: trimmed, type, isActive });
  };

  return (
    <>
      <DialogTitle>{isEditing ? 'Editar conta' : 'Nova conta'}</DialogTitle>
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
          <FormControl fullWidth>
            <InputLabel id="account-type-label">Tipo</InputLabel>
            <Select
              labelId="account-type-label"
              label="Tipo"
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'cash' | 'checking' | 'savings')
              }
            >
              {ACCOUNT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isEditing ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              }
              label="Conta ativa"
            />
          ) : null}
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

export function AccountFormDialog({
  open,
  onClose,
  onSubmit,
  account,
  loading,
}: AccountFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
    >
      {open ? (
        <AccountFormContent
          key={account?.id ?? 'new'}
          onClose={onClose}
          onSubmit={onSubmit}
          account={account}
          loading={loading}
        />
      ) : null}
    </Dialog>
  );
}
