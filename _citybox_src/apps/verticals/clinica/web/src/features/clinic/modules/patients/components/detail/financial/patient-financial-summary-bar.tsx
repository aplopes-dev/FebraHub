'use client';

import { AlertCircle, CircleCheck, Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import type { PatientFinancialTotals } from '../../../lib/compute-patient-financial-totals';

type PatientFinancialSummaryBarProps = {
  showReceived: boolean;
  totals: PatientFinancialTotals;
  onShowReceivedChange: (showReceived: boolean) => void;
  onNewDebit: () => void;
};

type FinancialTotalStatProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'received' | 'pending';
};

function FinancialTotalStat({ icon: Icon, label, value, tone }: FinancialTotalStatProps) {
  const isReceived = tone === 'received';

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-xl',
          isReceived
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-destructive/10 text-destructive',
        )}
        aria-hidden
      >
        <Icon className="size-7" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'text-base font-semibold',
            isReceived ? 'text-emerald-600' : 'text-destructive',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function PatientFinancialSummaryBar({
  showReceived,
  totals,
  onShowReceivedChange,
  onNewDebit,
}: PatientFinancialSummaryBarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <ClinicCompactSwitch
          id="patient-financial-show-received"
          checked={showReceived}
          onCheckedChange={(checked) => onShowReceivedChange(checked === true)}
        />
        <Label htmlFor="patient-financial-show-received" className="text-sm font-normal">
          Mostrar recebidos
        </Label>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 lg:flex-1 lg:justify-center">
        <FinancialTotalStat
          icon={CircleCheck}
          label="Total recebido"
          value={formatBrlCurrencyFromCents(totals.receivedCents)}
          tone="received"
        />

        <FinancialTotalStat
          icon={AlertCircle}
          label="Total a receber"
          value={formatBrlCurrencyFromCents(totals.pendingCents)}
          tone="pending"
        />
      </div>

      <Button type="button" onClick={onNewDebit} className="shrink-0 self-start lg:self-auto">
        <Plus className="mr-2 size-4" aria-hidden />
        Novo débito
      </Button>
    </div>
  );
}
