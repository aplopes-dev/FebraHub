'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import {
  downloadPatientDocumentPdf,
  printPatientDocumentPdf,
} from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { CommissionPeriodSelect } from '@/features/clinic/financeiro/comissoes/components/commission-period-select';
import { resolveCommissionPeriodDates } from '@/features/clinic/financeiro/comissoes/lib/filter-commissions-by-period';
import type { CommissionPeriodFilter } from '@/features/clinic/financeiro/comissoes/types/commission-financial.types';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { formatPdfPeriodLabel } from '@/features/clinic/lib/format-pdf-period-label';
import { formatLocalDateBr } from '../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import { groupCommissionsByRule } from '../lib/dashboard-commissions';
import {
  buildDashboardCommissionsPdf,
  buildDashboardCommissionsPdfFileName,
  mapClinicSettingsToCommissionsPdfClinic,
} from '../lib/build-dashboard-commissions-pdf';
import { useDashboardCommissionsDetailsQuery } from '../hooks/use-dashboard-commissions-details-query';
import {
  fetchDashboardCommissionsDetails,
} from '../services/dashboard.api.service';
import type { DashboardCommissionPaidRow } from '../types/clinic-dashboard';

const PAGE_SIZE = 20;

type DashboardCommissionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId?: string | null;
  professionalName?: string | null;
};

async function fetchAllCommissionDetailRows(input: {
  clinicId: string;
  startDate: string;
  endDate: string;
  professionalId?: string;
}): Promise<DashboardCommissionPaidRow[]> {
  const first = await fetchDashboardCommissionsDetails(input.clinicId, {
    startDate: input.startDate,
    endDate: input.endDate,
    professionalId: input.professionalId,
    page: 1,
    perPage: PAGE_SIZE,
  });
  const all = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page += 1) {
    const next = await fetchDashboardCommissionsDetails(input.clinicId, {
      startDate: input.startDate,
      endDate: input.endDate,
      professionalId: input.professionalId,
      page,
      perPage: PAGE_SIZE,
    });
    all.push(...next.items);
  }
  return all;
}

export function DashboardCommissionsDialog({
  open,
  onOpenChange,
  professionalId = null,
  professionalName = null,
}: DashboardCommissionsDialogProps) {
  const { clinicId } = useClinicId();
  const [period, setPeriod] = useState<CommissionPeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPeriod('this_month');
    setCustomStart(undefined);
    setCustomEnd(undefined);
    setPage(1);
  }, [open, professionalId]);

  const periodRange = useMemo(
    () => resolveCommissionPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  useEffect(() => {
    setPage(1);
  }, [period, customStart, customEnd, professionalId]);

  const { items, meta, isLoading, isError } =
    useDashboardCommissionsDetailsQuery(
      {
        startDate: periodRange.startDate,
        endDate: periodRange.endDate,
        professionalId: professionalId ?? undefined,
        page,
        perPage: PAGE_SIZE,
      },
      { enabled: open },
    );

  const ruleGroups = useMemo(() => groupCommissionsByRule(items), [items]);
  const totalNet = meta.totalNetCents;

  const title = professionalName
    ? `Comissões pagas a ${professionalName}`
    : 'Comissões pagas';

  const periodLabel = formatPdfPeriodLabel(
    periodRange.startDate,
    periodRange.endDate,
  );

  const handlePeriodChange = (next: CommissionPeriodFilter) => {
    setPeriod(next);
    if (next !== 'custom') {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  };

  const buildPdf = async () => {
    if (!clinicId) throw new Error('clinicId required');
    const [clinicProfile, rows] = await Promise.all([
      getClinicProfile(clinicId),
      fetchAllCommissionDetailRows({
        clinicId,
        startDate: periodRange.startDate,
        endDate: periodRange.endDate,
        professionalId: professionalId ?? undefined,
      }),
    ]);
    return buildDashboardCommissionsPdf({
      title,
      periodLabel,
      rows,
      clinic: mapClinicSettingsToCommissionsPdfClinic(clinicProfile),
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await buildPdf();
      downloadPatientDocumentPdf(
        blob,
        buildDashboardCommissionsPdfFileName(title),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const blob = await buildPdf();
      printPatientDocumentPdf(blob);
    } catch {
      toast.error('Não foi possível gerar o PDF para impressão');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setPage(1);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-full flex-col gap-0 p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-3 px-6 py-4">
          <DialogTitle>
            {professionalName ? (
              <>
                Comissões pagas a{' '}
                <span className="text-primary">{professionalName}</span>
              </>
            ) : (
              'Comissões pagas'
            )}
          </DialogTitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                disabled={
                  isExporting || isLoading || meta.total === 0 || !clinicId
                }
                onClick={() => void handleExport()}
              >
                <Download className="size-4" />
                Exportar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isPrinting || isLoading || meta.total === 0 || !clinicId
                }
                onClick={() => void handlePrint()}
              >
                <Printer className="size-4" />
                {isPrinting ? 'Gerando…' : 'Imprimir'}
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Comissões pagas filtradas por período, agrupadas por regra, plano,
            especialidade e procedimento.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-4">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando comissões…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as comissões.
            </p>
          ) : ruleGroups.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma comissão encontrada no período.
            </p>
          ) : (
            <>
              {ruleGroups.map((group) => {
                const groupHasInstallment = group.rows.some(
                  (row) => row.installment != null,
                );
                return (
                  <div key={group.id} className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 text-sm text-foreground">
                        <span className="font-semibold">
                          {group.triggerLabel}
                        </span>
                        {' - Plano '}
                        <span className="font-semibold">{group.planName}</span>
                        {' › Especialidade '}
                        <span className="font-semibold">
                          {group.specialtyName}
                        </span>
                        {' › Procedimento '}
                        <span className="font-semibold">
                          {group.treatmentSummary}
                        </span>
                      </p>
                      <p className="shrink-0 text-sm font-bold text-foreground">
                        {formatDashboardCurrencyFromCents(group.totalNetCents)}
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border/60">
                      <table
                        className={cn(
                          'w-full text-sm',
                          groupHasInstallment
                            ? 'min-w-[800px]'
                            : 'min-w-[720px]',
                        )}
                      >
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
                              Valor do procedimento
                            </th>
                            <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                              Custo do procedimento
                            </th>
                            {groupHasInstallment ? (
                              <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">
                                Parcela
                              </th>
                            ) : null}
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
                                idx < group.rows.length - 1 &&
                                  'border-b border-border/30',
                              )}
                            >
                              <td className="whitespace-nowrap px-3 py-2.5 text-sm text-foreground">
                                {formatLocalDateBr(item.paidAt)}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-foreground">
                                {item.patientName}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-foreground">
                                {item.treatmentName}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums text-foreground">
                                {formatDashboardCurrencyFromCents(
                                  item.treatmentValueCents,
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm tabular-nums text-foreground">
                                {formatDashboardCurrencyFromCents(
                                  item.treatmentCostCents,
                                )}
                              </td>
                              {groupHasInstallment ? (
                                <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                                  {item.installment ?? '—'}
                                </td>
                              ) : null}
                              <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-medium tabular-nums text-foreground">
                                {formatDashboardCurrencyFromCents(
                                  item.netCents,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              <div
                className="flex items-center justify-end gap-4 border-t border-border/50 pt-3"
                aria-live="polite"
              >
                <span className="font-medium">Total pago</span>
                <strong className="min-w-28 text-right tabular-nums">
                  {formatDashboardCurrencyFromCents(totalNet)}
                </strong>
              </div>
            </>
          )}
        </div>
        <Separator />
        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {meta.totalPages === 0
                ? '—'
                : `${meta.page} / ${meta.totalPages}`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={
                meta.totalPages === 0 ||
                page >= meta.totalPages ||
                isLoading
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(meta.totalPages, current + 1),
                )
              }
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
