'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@citybox/ui/atoms';
import { DataTable } from '@citybox/ui/organisms';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import { buildPatientWhatsAppUrl } from '@/features/clinic/modules/dashboard/lib/build-patient-whatsapp-url';
import { formatLocalDateBr } from '@/features/clinic/modules/dashboard/lib/dashboard-dates';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { mapClinicSettingsToPdfClinic } from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import { useClinicId } from '@/features/clinic/vendas/lib/use-clinic-id';
import { reportsDataTableStyleProps } from '@/features/clinic/modules/dashboard/reports/lib/reports-data-table-styles';
import {
  firstAppointmentStatusBadgeClass,
  formatFirstAppointmentStatusLabel,
} from '../lib/format-first-appointment-status';
import {
  buildIndicacoesReferredPatientsPdf,
  buildIndicacoesReferredPatientsPdfFileName,
} from '../lib/build-indicacoes-referred-patients-pdf';
import { formatIndicacoesPeriodLabel } from '../lib/format-indicacoes-period-label';
import { openIndicacoesWhatsApp } from '../lib/open-indicacoes-whatsapp';
import { listAllIndicacoesReferredPatients } from '../services/indicacoes.api.service';
import { useIndicacoesReferredPatientsQuery } from '../hooks/use-indicacoes-referred-patients-query';
import { IndicacoesPeriodFilters } from './indicacoes-period-filters';
import {
  DEFAULT_INDICACOES_PAGE_SIZE,
  IndicacoesPaginationBar,
  type IndicacoesPageSize,
} from './indicacoes-pagination-bar';
import type {
  IndicacoesPeriodMode,
  IndicacoesReferredPatient,
} from '../types/indicacoes';

type ReferralDateSort = 'asc' | 'desc';

type IndicacoesReferredPatientsSectionProps = {
  mode: IndicacoesPeriodMode;
  year: number;
  month: number;
  years: number[];
  onModeChange: (mode: IndicacoesPeriodMode) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function IndicacoesReferredPatientsSection({
  mode,
  year,
  month,
  years,
  onModeChange,
  onMonthChange,
  onYearChange,
}: IndicacoesReferredPatientsSectionProps) {
  const { clinicId, isReady } = useClinicId();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<IndicacoesPageSize>(
    DEFAULT_INDICACOES_PAGE_SIZE,
  );
  const [referralDateSort, setReferralDateSort] =
    useState<ReferralDateSort>('desc');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [mode, month, year, referralDateSort, pageSize]);

  const query = useIndicacoesReferredPatientsQuery({
    periodMode: mode,
    year,
    month: mode === 'monthly' ? month : undefined,
    page,
    perPage: pageSize,
    sortOrder: referralDateSort,
  });

  const rows = query.data?.items ?? [];
  const meta = query.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);

  const columns = useMemo<ColumnDef<IndicacoesReferredPatient>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Nome do paciente indicado',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'referredBy',
        accessorKey: 'referredBy',
        header: 'Quem indicou',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.referredBy || '—'}</span>
        ),
      },
      {
        id: 'referralDate',
        accessorKey: 'referralDate',
        header: () => (
          <button
            type="button"
            className="inline-flex w-full items-center justify-start gap-2 font-medium text-foreground"
            onClick={() =>
              setReferralDateSort((current) =>
                current === 'asc' ? 'desc' : 'asc',
              )
            }
            aria-label="Ordenar por Data da indicação"
          >
            Data da indicação
            {referralDateSort === 'asc' ? (
              <ArrowUp className="size-4" aria-hidden />
            ) : (
              <ArrowDown className="size-4" aria-hidden />
            )}
          </button>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatLocalDateBr(row.original.referralDate)}
          </span>
        ),
      },
      {
        id: 'firstAppointment',
        header: 'Primeira consulta',
        enableSorting: false,
        cell: ({ row }) => {
          const status = row.original.firstAppointmentStatus;
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="secondary"
                className={cn(
                  'w-fit font-medium',
                  firstAppointmentStatusBadgeClass(status),
                )}
              >
                {formatFirstAppointmentStatusLabel(status)}
              </Badge>
              {row.original.firstAppointmentDate ? (
                <span className="text-xs text-muted-foreground">
                  {formatLocalDateBr(row.original.firstAppointmentDate)}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'approvedBudgetsCount',
        accessorKey: 'approvedBudgetsCount',
        header: 'Orçamentos aprovados',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground tabular-nums">
            {row.original.approvedBudgetsCount}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const whatsappUrl = buildPatientWhatsAppUrl(
            row.original.phone,
            row.original.name,
          );
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[#1FA855] hover:text-[#1FA855]"
              disabled={!whatsappUrl}
              aria-label={`Conversar com ${row.original.name} pelo WhatsApp`}
              onClick={() =>
                openIndicacoesWhatsApp(row.original.phone, row.original.name)
              }
            >
              <WhatsappBrandIcon className="size-4" />
              Conversar
            </Button>
          );
        },
      },
    ],
    [referralDateSort],
  );

  async function handleExport() {
    if (!isReady || !clinicId) {
      toast.error('Selecione uma clínica para exportar.');
      return;
    }

    setIsExporting(true);
    try {
      const [profile, allRows] = await Promise.all([
        getClinicProfile(clinicId),
        listAllIndicacoesReferredPatients(clinicId, {
          periodMode: mode,
          year,
          month: mode === 'monthly' ? month : undefined,
          sortOrder: referralDateSort,
        }),
      ]);
      const blob = await buildIndicacoesReferredPatientsPdf({
        rows: allRows,
        periodLabel: formatIndicacoesPeriodLabel({ mode, year, month }),
        clinic: mapClinicSettingsToPdfClinic(profile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildIndicacoesReferredPatientsPdfFileName(),
      );
    } catch {
      toast.error('Não foi possível exportar o PDF.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">
          Pacientes indicados
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <IndicacoesPeriodFilters
            mode={mode}
            month={month}
            year={year}
            years={years}
            onModeChange={onModeChange}
            onMonthChange={onMonthChange}
            onYearChange={onYearChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting || total === 0 || query.isLoading}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando pacientes indicados…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-destructive">
            Não foi possível carregar os pacientes indicados.
          </p>
        ) : total === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum paciente indicado no período selecionado.
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rows}
              pageSize={pageSize}
              entityName="pacientes"
              emptyMessage="Nenhum paciente indicado no período."
              emptyPaginationLabel="Nenhum paciente"
              enableSorting={false}
              manualPagination
              pageIndex={page - 1}
              pageCount={totalPages}
              totalRowCount={total}
              onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
              paginationClassName="hidden"
              className={reportsDataTableStyleProps.className}
              tableWrapperClassName={
                reportsDataTableStyleProps.tableWrapperClassName
              }
              tableClassName={reportsDataTableStyleProps.tableClassName}
              headerClassName={reportsDataTableStyleProps.headerClassName}
            />
            <IndicacoesPaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              entitySingular="paciente"
              entityPlural="pacientes"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
