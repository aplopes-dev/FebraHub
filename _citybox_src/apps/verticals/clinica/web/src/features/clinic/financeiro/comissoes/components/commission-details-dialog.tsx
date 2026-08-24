'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@citybox/ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { useStore } from '@/lib/store-context';
import { CommissionPeriodSelect } from './commission-period-select';
import { printCommissionRowReport } from '../lib/commission-row-report-actions';
import { resolveCommissionPeriodDates } from '../lib/filter-commissions-by-period';
import {
  useCommissionHistoryDetailQuery,
  useOpenCommissionDetailQuery,
} from '../hooks/use-commissions-queries';
import type {
  CommissionPeriodFilter,
  CommissionSummaryRow,
} from '../types/commission-financial.types';

function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return iso;
  }
}

type CommissionDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: CommissionSummaryRow | null;
  mode: 'open' | 'history';
  /** Período da toolbar da página — usado ao abrir o modal. */
  initialPeriod?: CommissionPeriodFilter;
  initialCustomStart?: Date;
  initialCustomEnd?: Date;
  onPay?: (row: CommissionSummaryRow) => void;
};

export function CommissionDetailsDialog({
  open,
  onOpenChange,
  row,
  mode,
  initialPeriod = 'this_month',
  initialCustomStart,
  initialCustomEnd,
  onPay,
}: CommissionDetailsDialogProps) {
  const { storeId } = useStore();
  const [period, setPeriod] = useState<CommissionPeriodFilter>(initialPeriod);
  const [customStart, setCustomStart] = useState<Date | undefined>(initialCustomStart);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(initialCustomEnd);

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPeriod(initialPeriod);
    setCustomStart(initialCustomStart);
    setCustomEnd(initialCustomEnd);
  }, [open, initialPeriod, initialCustomStart, initialCustomEnd]);

  const periodRange = useMemo(
    () => resolveCommissionPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const openDetailQuery = useOpenCommissionDetailQuery(
    row?.professionalId ?? null,
    { startDate: periodRange.startDate, endDate: periodRange.endDate },
    open && mode === 'open' && Boolean(row?.professionalId),
  );

  const historyDetailQuery = useCommissionHistoryDetailQuery(
    row?.professionalId ?? null,
    { startDate: periodRange.startDate, endDate: periodRange.endDate },
    open && mode === 'history' && Boolean(row?.professionalId),
  );

  const displayRow = useMemo((): CommissionSummaryRow | null => {
    if (!row) return null;
    if (mode === 'open') return openDetailQuery.data ?? row;
    return historyDetailQuery.data ?? row;
  }, [row, mode, openDetailQuery.data, historyDetailQuery.data]);

  const isDetailLoading =
    mode === 'open'
      ? openDetailQuery.isFetching && !openDetailQuery.data
      : open &&
        Boolean(row?.professionalId) &&
        historyDetailQuery.isFetching &&
        !historyDetailQuery.data;

  if (!row || !displayRow) return null;

  const handlePeriodChange = (next: CommissionPeriodFilter) => {
    setPeriod(next);
    if (next !== 'custom') {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  const handlePay = () => {
    if (!onPay) return;
    onOpenChange(false);
    onPay(displayRow);
  };

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await printCommissionRowReport({
        row: displayRow,
        mode,
        periodRange,
        storeId,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex w-[calc(100vw-2rem)] max-w-5xl flex-col gap-4 overflow-hidden p-6',
          'max-h-[min(85dvh,40rem)] sm:max-w-5xl',
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === 'open' ? 'Comissões a pagar a' : 'Comissões pagas a'}{' '}
            <span className="text-primary">{displayRow.professionalName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <CommissionPeriodSelect
            value={period}
            onChange={handlePeriodChange}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Em breve"
            >
              <Download className="mr-1.5 size-4" aria-hidden />
              Exportar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPrinting || displayRow.ruleGroups.length === 0}
              onClick={handlePrint}
            >
              <Printer className="mr-1.5 size-4" aria-hidden />
              {isPrinting ? 'Gerando…' : 'Imprimir'}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden py-1 pr-1">
          {isDetailLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando detalhes…
            </div>
          ) : displayRow.ruleGroups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma comissão neste período.
            </p>
          ) : (
            displayRow.ruleGroups.map((group) => (
              <div key={group.id} className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 text-sm text-foreground">
                    <span className="font-semibold">{group.triggerLabel}</span>
                    {' - Plano '}
                    <span className="font-semibold">{group.planName}</span>
                    {' › Especialidade '}
                    <span className="font-semibold">{group.specialtyName}</span>
                    {' › Procedimento '}
                    <span className="font-semibold">{group.treatmentSummary}</span>
                  </p>
                  <p className="shrink-0 text-sm font-bold text-foreground">
                    {formatBrl(group.totalCommissionCents)}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40">
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Pago em
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Paciente
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                          Procedimento
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Valor Pago
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Custo do procedimento
                        </th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">
                          Parcela
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                          Comissão
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={cn(
                            idx < group.rows.length - 1 && 'border-b border-border/30',
                          )}
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                            {formatDate(item.paidAt)}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-foreground">
                            {item.patientName}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-foreground">
                            {item.treatmentName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-foreground">
                            {formatBrl(item.paidValueCents)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm text-foreground">
                            {formatBrl(item.treatmentCostCents)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                            {item.installment ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium text-foreground">
                            {formatBrl(item.commissionCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border/60 bg-muted/20">
                        <td
                          colSpan={6}
                          className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground"
                        >
                          Total
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold text-foreground">
                          {formatBrl(group.totalCommissionCents)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}

          {mode === 'history' &&
          displayRow.paidValueCents !== undefined &&
          displayRow.ruleGroups.length > 0 ? (
            <div className="space-y-2 border-t border-border/60 pt-4">
              {(displayRow.discountCents ?? 0) > 0 ? (
                <div className="flex items-center justify-end gap-3">
                  <span className="text-sm text-muted-foreground">Desconto</span>
                  <span className="text-sm font-medium text-foreground">
                    −{formatBrl(displayRow.discountCents ?? 0)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-end gap-3">
                <span className="text-sm text-muted-foreground">
                  Valor pago ao profissional
                </span>
                <span className="text-sm font-semibold text-green-700">
                  {formatBrl(displayRow.paidValueCents)}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {mode === 'open' && onPay ? (
            <Button
              type="button"
              onClick={handlePay}
              disabled={displayRow.ruleGroups.length === 0 || displayRow.totalCents <= 0}
            >
              Pagar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
