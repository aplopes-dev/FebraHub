'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { toast } from '@citybox/mui/molecules';
import {
  Box,
  Button,
  Input,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Panel } from '@/components/ui/panel';
import {
  canEditSplit,
  canViewFullSplit,
} from '@/features/shared/session/utils/permissions';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import {
  getAgentCommissionSlice,
  resolveDefaultSplit,
} from '@/features/finance/services/commission-service';
import { formatCents } from '@/features/shared/utils/format';
import {
  formatCentsToCurrencyInput,
  formatPercentInput,
  parseCurrencyToCents,
  parsePercentInput,
} from '../schemas/transaction-schema';
import { buildCommissionSplit } from '../utils/commission-split-math';
import {
  controlSx,
  outlineButtonSx,
} from '../utils/form-control-styles';
import { useUpdateSplit } from '../hooks/use-update-split';
import type { CommissionSplit, SplitSource, Transaction } from '../types';

type TransactionSplitFormProps = {
  transaction: Transaction;
};

export function TransactionSplitForm({ transaction }: TransactionSplitFormProps) {
  const user = useSessionUser();
  const canEdit = canEditSplit(user.role);
  const canViewFull = canViewFullSplit(user.role, user.organization.type);
  const updateSplit = useUpdateSplit();

  const [commissionPercent, setCommissionPercent] = useState(transaction.commissionPercent);
  const [split, setSplit] = useState<CommissionSplit>(transaction.split);
  const [splitSource, setSplitSource] = useState<SplitSource>(transaction.splitSource);

  useEffect(() => {
    setCommissionPercent(transaction.commissionPercent);
    setSplit(transaction.split);
    setSplitSource(transaction.splitSource);
  }, [
    transaction.id,
    transaction.commissionPercent,
    transaction.split,
    transaction.splitSource,
  ]);

  const rebuildSplit = useCallback(
    (nextCommissionPercent: number, currentSplit: CommissionSplit) => {
      return buildCommissionSplit(
        transaction.grossValueCents,
        nextCommissionPercent,
        {
          agencyPercent: currentSplit.agencyPercent,
          captorPercent: currentSplit.captorPercent,
          sellerPercent: currentSplit.sellerPercent,
          others: currentSplit.others,
        },
      );
    },
    [transaction.grossValueCents],
  );

  const updateCommissionPercent = useCallback(
    (value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      setCommissionPercent(clamped);
      setSplit(rebuildSplit(clamped, split));
      setSplitSource('MANUAL');
    },
    [rebuildSplit, split],
  );

  const updateTotalCommission = useCallback(
    (amountCents: number) => {
      const gross = transaction.grossValueCents;
      if (gross <= 0) return;
      const nextPercent = (amountCents / gross) * 100;
      updateCommissionPercent(nextPercent);
    },
    [transaction.grossValueCents, updateCommissionPercent],
  );

  const handleRestoreDefault = async () => {
    const resolved = await resolveDefaultSplit(
      { ...transaction, commissionPercent },
      'GLOBAL',
    );
    setSplit(resolved.split);
    setSplitSource(resolved.splitSource);
    toast.message('Comissão restaurada ao padrão.');
  };

  const handleSave = () => {
    updateSplit.mutate(
      {
        id: transaction.id,
        commissionPercent,
        split,
        source: splitSource,
        actorName: user.name,
      },
      {
        onSuccess: () => toast.success('Comissões salvas.'),
        onError: () => toast.error('Erro ao salvar comissões.'),
      },
    );
  };

  if (!canViewFull) {
    const slice = getAgentCommissionSlice(transaction, user.id);
    return (
      <Panel className="flex flex-col gap-4">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
          Sua comissão
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Você participa deste negócio como{' '}
          <strong>{slice.role === 'captor' ? 'captador' : 'vendedor'}</strong>.
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {formatCents(slice.amountCents)}
        </Typography>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-6">
      <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
        Comissões
      </Typography>

      <PermissionGate allowed={canEdit}>
        <Box className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Comissão total
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Valor bruto do negócio: {formatCents(transaction.grossValueCents)}
          </Typography>
          <Box className="mt-4 grid gap-4 sm:grid-cols-2">
            <CommissionField
              label="Percentual (%)"
              percent={commissionPercent}
              amountCents={split.totalCommissionCents}
              onPercentChange={updateCommissionPercent}
              onAmountChange={updateTotalCommission}
              showPercentOnly
            />
            <CommissionField
              label="Valor total (R$)"
              percent={commissionPercent}
              amountCents={split.totalCommissionCents}
              onPercentChange={updateCommissionPercent}
              onAmountChange={updateTotalCommission}
              showAmountOnly
            />
          </Box>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 1 }}
          sx={{
            alignItems: { xs: 'stretch', sm: 'center' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            type="button"
            variant="outlined"
            sx={[
              outlineButtonSx,
              { width: { xs: '100%', sm: 'auto' } },
            ] as SxProps<Theme>}
            disabled={updateSplit.isPending}
            onClick={() => void handleRestoreDefault()}
          >
            Restaurar padrão
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={updateSplit.isPending}
            onClick={handleSave}
            sx={{
              borderRadius: 999,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {updateSplit.isPending ? 'Salvando…' : 'Salvar comissões'}
          </Button>
        </Stack>
      </PermissionGate>

      {!canEdit ? (
        <Box className="text-sm">
          <p className="text-muted-foreground">Comissão total</p>
          <p className="font-medium">
            {commissionPercent}% ({formatCents(split.totalCommissionCents)})
          </p>
        </Box>
      ) : null}
    </Panel>
  );
}

function CommissionField({
  label,
  percent,
  amountCents,
  onPercentChange,
  onAmountChange,
  showPercentOnly,
  showAmountOnly,
}: {
  label: string;
  percent: number;
  amountCents: number;
  onPercentChange: (value: number) => void;
  onAmountChange: (value: number) => void;
  showPercentOnly?: boolean;
  showAmountOnly?: boolean;
}) {
  if (showPercentOnly) {
    return (
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Input
            type="text"
            inputMode="decimal"
            value={formatPercentInput(percent)}
            fullWidth
            sx={controlSx}
            onChange={(e) => onPercentChange(parsePercentInput(e.target.value))}
          />
          <Typography variant="body2" color="text.secondary">
            %
          </Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Input
        type="text"
        inputMode="numeric"
        value={formatCentsToCurrencyInput(amountCents)}
        fullWidth
        sx={controlSx}
        onChange={(e) => onAmountChange(parseCurrencyToCents(e.target.value))}
      />
      <Typography variant="caption" color="text.secondary">
        {formatCents(amountCents)}
      </Typography>
    </Stack>
  );
}
