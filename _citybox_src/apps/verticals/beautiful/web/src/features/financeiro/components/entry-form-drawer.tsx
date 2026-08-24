'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { Drawer, FormField } from '@citybox/mui/molecules';
import {
  formatCurrencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from '@/lib/field-masks';
import type {
  ExpenseCategory,
  FinancialAccount,
  FinancialEntry,
  IncomeCategory,
} from '../types';
import { PAYMENT_METHOD_OPTIONS } from '../types';

const DRAWER_WIDTH = 620;

export type EntryFormValues = {
  description: string;
  value: number;
  dueDate: string;
  categoryId?: string;
  incomeCategoryId?: string;
  accountId?: string;
  paymentMethod?: string;
  isPaid: boolean;
  settledAt?: string;
  paidValue?: number;
};

export type EntryFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EntryFormValues) => void;
  type: 'income' | 'expense';
  entry?: FinancialEntry | null;
  accounts: FinancialAccount[];
  expenseCategories: ExpenseCategory[];
  incomeCategories: IncomeCategory[];
  loading?: boolean;
};

/** Alias para retrocompatibilidade se necessário */
export type EntryFormDialogProps = EntryFormDrawerProps;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function EntryFormDrawerContent({
  onClose,
  onSubmit,
  type,
  entry,
  accounts,
  expenseCategories,
  incomeCategories,
  loading = false,
  onRenderFooter,
}: Omit<EntryFormDrawerProps, 'open'> & {
  onRenderFooter?: (footer: ReactNode) => void;
}) {
  const isEditing = Boolean(entry);
  const isIncome = type === 'income';

  const [description, setDescription] = useState(entry?.description ?? '');
  const [valueStr, setValueStr] = useState(
    entry ? formatCurrencyInput(entry.value) : '',
  );
  const [dueDate, setDueDate] = useState(entry?.dueDate ?? todayIso());
  const [categoryId, setCategoryId] = useState(
    isIncome
      ? (entry?.incomeCategoryId ?? '')
      : (entry?.categoryId ?? ''),
  );
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [settledAt, setSettledAt] = useState(todayIso());
  const [paidValueStr, setPaidValueStr] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = isIncome ? incomeCategories : expenseCategories;

  const validate = (): EntryFormValues | null => {
    const next: Record<string, string> = {};
    const trimmed = description.trim();
    if (!trimmed) next.description = 'Informe a descrição.';

    const value = parseCurrencyInput(valueStr);
    if (!Number.isFinite(value) || value <= 0) {
      next.value = 'Informe um valor maior que zero.';
    }

    if (!dueDate) next.dueDate = 'Informe a data de vencimento.';

    let paidValue: number | undefined;
    if (!isEditing && isPaid) {
      if (!paymentMethod) next.paymentMethod = 'Selecione a forma de pagamento.';
      if (!accountId) next.accountId = 'Selecione a conta.';
      if (!settledAt) next.settledAt = 'Informe a data da liquidação.';
      const paidRaw = paidValueStr.trim()
        ? parseCurrencyInput(paidValueStr)
        : value;
      if (!Number.isFinite(paidRaw) || paidRaw <= 0) {
        next.paidValue = 'Informe o valor liquidado.';
      } else {
        paidValue = paidRaw;
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return {
      description: trimmed,
      value,
      dueDate,
      ...(isIncome
        ? categoryId
          ? { incomeCategoryId: categoryId }
          : {}
        : categoryId
          ? { categoryId }
          : {}),
      ...(accountId && !isEditing ? { accountId } : {}),
      ...(paymentMethod && !isEditing ? { paymentMethod } : {}),
      isPaid: !isEditing && isPaid,
      ...(!isEditing && isPaid
        ? { settledAt, paidValue: paidValue ?? value }
        : {}),
    };
  };

  const handleSubmit = () => {
    const values = validate();
    if (!values) return;
    onSubmit(values);
  };

  const handleClose = () => {
    if (loading) return;
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
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : undefined
          }
        >
          {loading ? 'Salvando…' : 'Salvar'}
        </Button>
      </Stack>
    );
  });

  return (
    <Stack spacing={2.5}>
      <FormField
        label="Descrição *"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={Boolean(errors.description)}
        helperText={errors.description}
        fullWidth
        autoFocus
        disabled={loading}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label="Valor (R$) *"
          value={valueStr}
          onChange={(e) => setValueStr(maskCurrencyInput(e.target.value))}
          error={Boolean(errors.value)}
          helperText={errors.value}
          fullWidth
          placeholder="0,00"
          disabled={loading}
        />
        <FormField
          label="Vencimento *"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={Boolean(errors.dueDate)}
          helperText={errors.dueDate}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={loading}
        />
      </Stack>

      <FormControl fullWidth disabled={loading}>
        <InputLabel id="entry-category-label">Categoria</InputLabel>
        <Select
          labelId="entry-category-label"
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(String(e.target.value))}
        >
          <MenuItem value="">
            <em>Sem categoria</em>
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!isEditing ? (
        <>
          {!isPaid ? (
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="entry-account-label">Conta</InputLabel>
              <Select
                labelId="entry-account-label"
                label="Conta"
                value={accountId}
                onChange={(e) => setAccountId(String(e.target.value))}
              >
                <MenuItem value="">
                  <em>Opcional</em>
                </MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <FormControlLabel
            control={
              <Checkbox
                checked={isPaid}
                disabled={loading}
                onChange={(e) => {
                  setIsPaid(e.target.checked);
                  if (e.target.checked && !paidValueStr) {
                    setPaidValueStr(valueStr);
                  }
                }}
              />
            }
            label={isIncome ? 'Já recebido' : 'Já pago'}
          />

          {isPaid ? (
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth error={Boolean(errors.paymentMethod)} disabled={loading}>
                  <InputLabel id="entry-payment-method-label">
                    Forma de pagamento *
                  </InputLabel>
                  <Select
                    labelId="entry-payment-method-label"
                    label="Forma de pagamento *"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(String(e.target.value))}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth error={Boolean(errors.accountId)} disabled={loading}>
                  <InputLabel id="entry-settle-account-label">
                    Conta *
                  </InputLabel>
                  <Select
                    labelId="entry-settle-account-label"
                    label="Conta *"
                    value={accountId}
                    onChange={(e) => setAccountId(String(e.target.value))}
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormField
                  label={
                    isIncome
                      ? 'Data do recebimento *'
                      : 'Data do pagamento *'
                  }
                  type="date"
                  value={settledAt}
                  onChange={(e) => setSettledAt(e.target.value)}
                  error={Boolean(errors.settledAt)}
                  helperText={errors.settledAt}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={loading}
                />
                <FormField
                  label="Valor liquidado (R$)"
                  value={paidValueStr}
                  onChange={(e) => setPaidValueStr(maskCurrencyInput(e.target.value))}
                  error={Boolean(errors.paidValue)}
                  helperText={errors.paidValue}
                  fullWidth
                  placeholder="Igual ao valor se vazio"
                  disabled={loading}
                />
              </Stack>
            </Stack>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}

/**
 * Drawer lateral para criação e edição de lançamentos de fluxo de caixa (receita / despesa).
 * Utiliza o componente Drawer de @citybox/mui/molecules com botões fixos no rodapé.
 */
export function EntryFormDrawer({
  open,
  onClose,
  onSubmit,
  type,
  entry,
  accounts,
  expenseCategories,
  incomeCategories,
  loading = false,
}: EntryFormDrawerProps) {
  const [footerNode, setFooterNode] = useState<ReactNode>(null);
  const isEditing = Boolean(entry);
  const isIncome = type === 'income';

  const title = isEditing
    ? 'Editar lançamento'
    : isIncome
      ? 'Nova receita'
      : 'Nova despesa';

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

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
        <EntryFormDrawerContent
          key={entry?.id ?? `new-${type}`}
          onClose={onClose}
          onSubmit={onSubmit}
          type={type}
          entry={entry}
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          loading={loading}
          onRenderFooter={setFooterNode}
        />
      ) : null}
    </Drawer>
  );
}

/** Alias para retrocompatibilidade se necessário */
export const EntryFormDialog = EntryFormDrawer;
