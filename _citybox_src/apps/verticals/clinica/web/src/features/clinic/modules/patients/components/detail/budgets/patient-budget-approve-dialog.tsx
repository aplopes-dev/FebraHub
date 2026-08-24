'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, HelpCircle, Loader2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  buildBudgetApproveInstallmentSchedule,
  redistributeBudgetApproveInstallmentValues,
  type BudgetApproveInstallmentRow,
} from '../../../lib/budget-approve-installment-schedule';
import { countBudgetApproveRevenues } from '../../../lib/count-budget-approve-revenues';
import {
  calculateInstallmentBalanceCents,
  formatCentsToBrlInput,
  parseBrlCurrencyToCents,
  parsePositiveInteger,
} from '../../../lib/patient-budget-form-utils';
import type { PatientBudgetInstallment } from '../../../types/patient-budget-form';

const RECEITAS_TOOLTIP =
  'Ao aprovar o orçamento sem parcelamento, cada tratamento será lançado como uma receita separada no financeiro.';

const INSTALLMENT_COUNT_OPTIONS = Array.from({ length: 24 }, (_, index) => index + 1);

function startOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export type PatientBudgetApproveConfirmInput = {
  /** Vencimento único (orçamento sem parcelamento) ou base da 1ª parcela. */
  dueDate: Date;
  /** Parcelas editáveis; só quando o orçamento está parcelado. */
  installments?: Array<{ dueDate: Date; valueCents: number }>;
};

export type PatientBudgetApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCents: number;
  treatmentsCount: number;
  installment: PatientBudgetInstallment;
  emitContractOnApprove: boolean;
  isApproving?: boolean;
  onConfirm: (input: PatientBudgetApproveConfirmInput) => void | Promise<void>;
};

export function PatientBudgetApproveDialog({
  open,
  onOpenChange,
  totalCents,
  treatmentsCount,
  installment,
  emitContractOnApprove,
  isApproving = false,
  onConfirm,
}: PatientBudgetApproveDialogProps) {
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [schedule, setSchedule] = useState<BudgetApproveInstallmentRow[]>([]);

  const isInstallment = installment.enabled;
  const downPaymentCents = parseBrlCurrencyToCents(installment.downPayment);
  const balanceCents = calculateInstallmentBalanceCents(totalCents, downPaymentCents);

  useEffect(() => {
    if (!open) return;

    const today = startOfToday();
    setDueDate(today);

    if (!installment.enabled) {
      setSchedule([]);
      setInstallmentsCount(1);
      return;
    }

    const count = Math.max(1, parsePositiveInteger(installment.installmentsCount) || 1);
    setInstallmentsCount(count);
    setSchedule(
      buildBudgetApproveInstallmentSchedule({
        balanceCents: calculateInstallmentBalanceCents(
          totalCents,
          parseBrlCurrencyToCents(installment.downPayment),
        ),
        installmentsCount: count,
        baseDueDate: today,
      }),
    );
  }, [open, installment, totalCents]);

  const totalLabel = formatBrlCurrencyFromCents(totalCents);
  const revenuesCount = useMemo(() => {
    if (!isInstallment) {
      return countBudgetApproveRevenues({ treatmentsCount, installment });
    }
    return (downPaymentCents > 0 ? 1 : 0) + installmentsCount;
  }, [
    downPaymentCents,
    installment,
    installmentsCount,
    isInstallment,
    treatmentsCount,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isApproving) return;
    onOpenChange(nextOpen);
  };

  const handleInstallmentsCountChange = (value: string) => {
    const count = Number.parseInt(value, 10);
    if (!Number.isFinite(count) || count < 1) return;

    setInstallmentsCount(count);
    const base = schedule[0]?.dueDate ?? dueDate ?? startOfToday();
    setSchedule(
      buildBudgetApproveInstallmentSchedule({
        balanceCents,
        installmentsCount: count,
        baseDueDate: base,
      }),
    );
  };

  const handleInstallmentDueDateChange = (index: number, date: Date | null) => {
    if (!date) return;
    setSchedule((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, dueDate: date } : row,
      ),
    );
  };

  const handleInstallmentValueChange = (index: number, rawValue: string) => {
    const nextValueCents = parseBrlCurrencyToCents(rawValue);
    setSchedule((current) => {
      const redistributed = redistributeBudgetApproveInstallmentValues({
        valuesCents: current.map((row) => row.valueCents),
        changedIndex: index,
        nextValueCents,
        totalCents: balanceCents,
      });
      return current.map((row, rowIndex) => ({
        ...row,
        valueCents: redistributed[rowIndex] ?? row.valueCents,
      }));
    });
  };

  const handleConfirm = () => {
    if (isApproving) return;

    if (isInstallment) {
      if (schedule.length === 0) return;
      if (schedule.some((row) => !row.dueDate)) return;
      void onConfirm({
        dueDate: schedule[0]!.dueDate,
        installments: schedule.map((row) => ({
          dueDate: row.dueDate,
          valueCents: row.valueCents,
        })),
      });
      return;
    }

    if (!dueDate) return;
    void onConfirm({ dueDate });
  };

  const canConfirm = isInstallment
    ? schedule.length > 0 && schedule.every((row) => row.dueDate)
    : Boolean(dueDate);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Aprovar orçamento</DialogTitle>
          <DialogDescription>
            Ao aprovar esse orçamento, os tratamentos estarão disponíveis automaticamente na aba
            Tratamentos e os valores na aba Débitos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CircleDollarSign className="size-5 shrink-0 text-emerald-600" aria-hidden />
            <span>Valor total do orçamento: {totalLabel}</span>
          </div>

          {isInstallment ? (
            <>
              <Separator />

              <div className="space-y-1.5">
                <Label htmlFor="budget-approve-installments-count">Parcelas</Label>
                <Select
                  value={String(installmentsCount)}
                  onValueChange={handleInstallmentsCountChange}
                  disabled={isApproving}
                >
                  <SelectTrigger
                    id="budget-approve-installments-count"
                    className="h-10 w-full"
                    aria-label="Número de parcelas"
                  >
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_COUNT_OPTIONS.map((count) => (
                      <SelectItem key={count} value={String(count)}>
                        {count}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] gap-2 px-0.5 text-xs font-medium text-muted-foreground">
                  <span>Parcela</span>
                  <span>Vencimento</span>
                  <span className="text-right">Valor</span>
                </div>

                <div className="max-h-[min(40vh,16rem)] space-y-2 overflow-y-auto pr-1">
                  {schedule.map((row, index) => (
                    <div
                      key={row.index}
                      className="grid grid-cols-[4.5rem_minmax(0,1fr)_7.5rem] items-center gap-2"
                    >
                      <span className="text-sm tabular-nums text-foreground">
                        {row.index} de {installmentsCount}
                      </span>
                      <DatePicker
                        value={row.dueDate}
                        placeholder="Selecionar data"
                        className="h-9 w-full"
                        disabled={isApproving}
                        aria-label={`Vencimento da parcela ${row.index}`}
                        onChange={(date) => handleInstallmentDueDateChange(index, date ?? null)}
                      />
                      <PlanBrlCurrencyInput
                        id={`budget-approve-installment-value-${row.index}`}
                        className="h-9"
                        value={formatCentsToBrlInput(row.valueCents)}
                        disabled={isApproving}
                        aria-label={`Valor da parcela ${row.index}`}
                        onValueChange={(value) => handleInstallmentValueChange(index, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <DatePicker
                value={dueDate ?? undefined}
                placeholder="Selecionar data"
                className="w-full"
                disabled={isApproving}
                aria-label="Vencimento"
                onChange={(date) => setDueDate(date ?? null)}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Resumo</h3>

            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
              {isInstallment ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Condições de pagamento</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {installmentsCount}x
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Receitas</span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Sobre as receitas"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <HelpCircle className="size-3.5" aria-hidden />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3 text-xs leading-relaxed">
                          {RECEITAS_TOOLTIP}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium tabular-nums text-foreground">{revenuesCount}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Valor total do orçamento</span>
                <span className="font-medium tabular-nums text-foreground">{totalLabel}</span>
              </div>
            </div>
          </div>

          {emitContractOnApprove ? (
            <p className="text-sm text-muted-foreground">
              Ao aprovar, o <span className="font-semibold text-foreground">contrato</span> será
              exibido para conferência e emissão.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isApproving}
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          <Button type="button" disabled={isApproving || !canConfirm} onClick={handleConfirm}>
            {isApproving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Aprovando…
              </>
            ) : (
              'Aprovar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
