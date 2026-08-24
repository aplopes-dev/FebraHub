'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
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
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableStyleProps } from '@/features/shared/lib/data-table-styles';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type {
  DashboardInadimplenciaDebtRow,
  InadimplenciaPeriodMode,
} from '../types/clinic-dashboard';
import { formatLocalDateBr } from '../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import { buildPatientWhatsAppUrl } from '../lib/build-patient-whatsapp-url';
import {
  buildDashboardInadimplentesPdf,
  buildDashboardInadimplentesPdfFileName,
  mapClinicSettingsToInadimplenciaPdfClinic,
} from '../lib/build-dashboard-inadimplencia-pdf';
import { useDashboardInadimplenciaDetailsQuery } from '../hooks/use-dashboard-inadimplencia-details-query';
import { fetchDashboardInadimplenciaDetails } from '../services/dashboard.api.service';

const PAGE_SIZE = 20;

type DashboardInadimplenciaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  periodMode: InadimplenciaPeriodMode;
  year: number;
  month?: number;
};

async function fetchAllInadimplenciaDetailRows(input: {
  clinicId: string;
  periodMode: InadimplenciaPeriodMode;
  year: number;
  month?: number;
}): Promise<DashboardInadimplenciaDebtRow[]> {
  const first = await fetchDashboardInadimplenciaDetails(input.clinicId, {
    periodMode: input.periodMode,
    year: input.year,
    month: input.month,
    page: 1,
    perPage: PAGE_SIZE,
  });
  const all = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page += 1) {
    const next = await fetchDashboardInadimplenciaDetails(input.clinicId, {
      periodMode: input.periodMode,
      year: input.year,
      month: input.month,
      page,
      perPage: PAGE_SIZE,
    });
    all.push(...next.items);
  }
  return all;
}

export function DashboardInadimplenciaDialog({
  open,
  onOpenChange,
  title,
  periodMode,
  year,
  month,
}: DashboardInadimplenciaDialogProps) {
  const { clinicId } = useClinicId();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, periodMode, year, month]);

  const query = useDashboardInadimplenciaDetailsQuery(
    {
      periodMode,
      year,
      month,
      page,
      perPage: PAGE_SIZE,
    },
    { enabled: open },
  );

  const rows = query.items;
  const meta = query.meta;

  const columns = useMemo<ColumnDef<DashboardInadimplenciaDebtRow>[]>(
    () => [
      {
        accessorKey: 'dueDate',
        header: 'Data de vencimento',
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatLocalDateBr(row.original.dueDate)}
          </span>
        ),
      },
      {
        accessorKey: 'daysOverdue',
        header: 'Dias de atraso',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.daysOverdue}</span>
        ),
      },
      {
        accessorKey: 'patientName',
        header: 'Paciente',
        cell: ({ row }) => (
          <Link
            href={`/pacientes/${row.original.patientId}/sobre`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {row.original.patientName}
            <span className="sr-only"> (abre em nova aba)</span>
          </Link>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Descrição',
        cell: ({ row }) => (
          <span className="line-clamp-2">{row.original.description}</span>
        ),
      },
      {
        accessorKey: 'unpaidCents',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatDashboardCurrencyFromCents(row.original.unpaidCents)}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Telefone',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatPhone(row.original.phone ?? '') || 'Sem telefone'}
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
            row.original.patientName,
          );
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={!whatsappUrl}
              aria-label={`Conversar com ${row.original.patientName} pelo WhatsApp`}
              onClick={() => {
                if (!whatsappUrl) {
                  toast.error('Paciente sem telefone cadastrado');
                  return;
                }
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <WhatsappBrandIcon className="size-4" />
              Conversar
            </Button>
          );
        },
      },
    ],
    [],
  );

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const [allRows, clinicProfile] = await Promise.all([
        fetchAllInadimplenciaDetailRows({
          clinicId,
          periodMode,
          year,
          month,
        }),
        getClinicProfile(clinicId),
      ]);
      const blob = await buildDashboardInadimplentesPdf({
        title,
        rows: allRows,
        clinic: mapClinicSettingsToInadimplenciaPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardInadimplentesPdfFileName(title),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-full flex-col gap-0 p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle>{title}</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                isExporting ||
                query.isLoading ||
                meta.total === 0 ||
                !clinicId
              }
              onClick={() => void handleExport()}
            >
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Lista de débitos em aberto no período selecionado.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {query.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando inadimplentes…
            </p>
          ) : query.isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os inadimplentes.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum débito em aberto no período.
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              manualPagination
              pageIndex={page - 1}
              pageCount={meta.totalPages}
              pageSize={PAGE_SIZE}
              totalRowCount={meta.total}
              onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
              {...erpDataTableStyleProps}
            />
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
