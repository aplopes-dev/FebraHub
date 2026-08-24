'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Drawer, FormField } from '@citybox/mui/molecules';
import { Icon } from '@citybox/mui/icons';
import type { IconProps } from '@citybox/mui/icons';
import {
  formatCurrencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from '@/lib/field-masks';
import type { FinancialAccount, FinancialEntry } from '../types';
import { formatCurrency } from '../lib/filter-entries';

const DRAWER_WIDTH = 620;

export type SettleEntryFormValues = {
  paymentMethod: string;
  accountId: string;
  paidValue: number;
  settledAt: string;
  observation?: string;
};

export type SettleEntryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SettleEntryFormValues) => void;
  entry: FinancialEntry | null;
  mode: 'receive' | 'pay';
  accounts: FinancialAccount[];
  loading?: boolean;
  viewMode?: boolean;
};

/** Alias de compatibilidade para código legado */
export type SettleEntryDialogProps = SettleEntryDrawerProps;

type PaymentMethodItem = {
  id: string;
  label: string;
  icon: IconProps['name'];
};

/**
 * Opções de meios de pagamento para o projeto Beautiful.
 * Nota: Cheque foi removido conforme especificado pelas regras da vertical.
 */
const BEAUTIFUL_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'pix', label: 'PIX', icon: 'zap' },
  { id: 'cash', label: 'Dinheiro', icon: 'wallet' },
  { id: 'credit', label: 'Crédito', icon: 'credit-card' },
  { id: 'debit', label: 'Débito', icon: 'credit-card' },
  { id: 'transfer', label: 'Transferência', icon: 'transfer' },
  { id: 'boleto', label: 'Boleto', icon: 'receipt' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateBr(isoString: string): string {
  if (!isoString) return '—';
  const datePart = isoString.slice(0, 10);
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return isoString;
  return `${day}/${month}/${year}`;
}

/**
 * Card de resumo do lançamento no topo do Drawer
 */
function EntrySummaryCard({ entry }: { entry: FinancialEntry }) {
  const categoryName = entry.incomeCategory?.name ?? entry.category?.name;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, pr: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {entry.description}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Vencimento: {formatDateBr(entry.dueDate)}
              </Typography>
              {categoryName ? (
                <>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {categoryName}
                  </Typography>
                </>
              ) : null}
            </Stack>
          </Box>

          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Valor original
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: entry.type === 'income' ? 'success.main' : 'text.primary',
              }}
            >
              {formatCurrency(entry.value)}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}

/**
 * Seletor visual de meio de pagamento (grid de botões com ícones)
 */
function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (method: string) => void;
  disabled?: boolean;
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
        Meios de pagamento *
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        {BEAUTIFUL_PAYMENT_METHODS.map((method) => {
          const isSelected = value === method.id;

          return (
            <ButtonBase
              key={method.id}
              disabled={disabled}
              onClick={() => onChange(method.id)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: isSelected ? 'primary.main' : 'action.active',
                  bgcolor: isSelected ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <Icon
                name={method.icon}
                size={20}
                sx={{
                  color: isSelected ? 'primary.main' : 'text.secondary',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? 'primary.main' : 'text.primary',
                  fontSize: '0.8125rem',
                }}
              >
                {method.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Stack>
  );
}

function SettleEntryDrawerContent({
  onClose,
  onSubmit,
  entry,
  mode,
  accounts,
  loading = false,
  viewMode = false,
  onRenderFooter,
}: Omit<SettleEntryDrawerProps, 'open'> & {
  entry: FinancialEntry;
  onRenderFooter?: (footer: ReactNode) => void;
}) {
  const isReceive = mode === 'receive';

  const [paymentMethod, setPaymentMethod] = useState(entry.paymentMethod || 'pix');
  const [accountId, setAccountId] = useState(() => entry.account?.id || accounts[0]?.id || '');
  const [paidValueStr, setPaidValueStr] = useState(() =>
    formatCurrencyInput(entry.paidValue ?? entry.value),
  );
  const [settledAt, setSettledAt] = useState(() => entry.paidAt?.slice(0, 10) || todayIso());
  const [observation, setObservation] = useState(entry.observation || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = () => {
    if (viewMode) return;

    const next: Record<string, string> = {};
    if (!paymentMethod) next.paymentMethod = 'Selecione a forma de pagamento.';
    if (!accountId) next.accountId = 'Selecione a conta de destino.';
    if (!settledAt) next.settledAt = 'Informe a data.';

    const paidValue = parseCurrencyInput(paidValueStr);
    if (!Number.isFinite(paidValue) || paidValue <= 0) {
      next.paidValue = 'Informe um valor maior que zero.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      paymentMethod,
      accountId,
      paidValue,
      settledAt,
      observation: observation.trim() || undefined,
    });
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
          {viewMode ? 'Fechar' : 'Cancelar'}
        </Button>

        {!viewMode ? (
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
            {loading
              ? 'Salvando…'
              : isReceive
              ? 'Registrar recebimento'
              : 'Registrar pagamento'}
          </Button>
        ) : null}
      </Stack>
    );
  });

  return (
    <Stack spacing={2.5}>
      {/* ── Summary Card do lançamento ── */}
      <EntrySummaryCard entry={entry} />

      {/* ── Seleção de Meios de pagamento ── */}
      <PaymentMethodPicker
        value={paymentMethod}
        onChange={setPaymentMethod}
        disabled={loading || viewMode}
      />
      {errors.paymentMethod ? (
        <Typography variant="caption" color="error" sx={{ mt: -1 }}>
          {errors.paymentMethod}
        </Typography>
      ) : null}

      {/* ── Conta / Caixa ── */}
      <FormControl fullWidth error={Boolean(errors.accountId)} disabled={loading || viewMode}>
        <InputLabel id="settle-account-label">Conta / Caixa *</InputLabel>
        <Select
          labelId="settle-account-label"
          label="Conta / Caixa *"
          value={accountId}
          onChange={(e) => setAccountId(String(e.target.value))}
        >
          {accounts.map((acc) => (
            <MenuItem key={acc.id} value={acc.id}>
              {acc.name}
            </MenuItem>
          ))}
        </Select>
        {errors.accountId ? (
          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
            {errors.accountId}
          </Typography>
        ) : null}
      </FormControl>

      {/* ── Data e Valor Liquidado ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormField
          label={isReceive ? 'Data do recebimento *' : 'Data do pagamento *'}
          type="date"
          value={settledAt}
          onChange={(e) => setSettledAt(e.target.value)}
          error={Boolean(errors.settledAt)}
          helperText={errors.settledAt}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          disabled={loading || viewMode}
        />

        <FormField
          label={isReceive ? 'Valor recebido (R$) *' : 'Valor pago (R$) *'}
          value={paidValueStr}
          onChange={(e) => setPaidValueStr(maskCurrencyInput(e.target.value))}
          placeholder="0,00"
          error={Boolean(errors.paidValue)}
          helperText={errors.paidValue}
          fullWidth
          disabled={loading || viewMode}
        />
      </Stack>

      {/* ── Observações adicionais ── */}
      <FormField
        label="Observações"
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        fullWidth
        multiline
        rows={2}
        placeholder="Opcional."
        disabled={loading || viewMode}
      />
    </Stack>
  );
}

/**
 * Drawer lateral para recebimento ou pagamento de lançamentos (liquidação de receita/despesa).
 * Utiliza o componente Drawer de @citybox/mui/molecules e segue o layout da Clínica com rodapé fixo.
 */
export function SettleEntryDrawer({
  open,
  onClose,
  onSubmit,
  entry,
  mode,
  accounts,
  loading = false,
  viewMode = false,
}: SettleEntryDrawerProps) {
  const [footerNode, setFooterNode] = useState<ReactNode>(null);
  const isReceive = mode === 'receive';

  const title = viewMode
    ? isReceive
      ? 'Detalhes do recebimento'
      : 'Detalhes do pagamento'
    : isReceive
    ? 'Registrar Recebimento'
    : 'Registrar Pagamento';

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
      {open && entry ? (
        <SettleEntryDrawerContent
          key={`${mode}-${entry.id}`}
          onClose={onClose}
          onSubmit={onSubmit}
          entry={entry}
          mode={mode}
          accounts={accounts}
          loading={loading}
          viewMode={viewMode}
          onRenderFooter={setFooterNode}
        />
      ) : null}
    </Drawer>
  );
}

/** Alias para compatibilidade de nome */
export const SettleEntryDialog = SettleEntryDrawer;

