'use client';

import { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import {
  DEFAULT_REPORT_PERIOD,
  REPORT_PERIOD_OPTIONS,
  resolveReportBirthdayRange,
} from '@/features/clinic/modules/dashboard/reports/lib/reports-period';
import type { ReportPeriodFilter } from '@/features/clinic/modules/dashboard/reports/types/clinic-reports';
import {
  DOCUMENT_TIPO_TO_KIND,
  EMPTY_ASSINATURA_RELATORIO_STATS,
} from '../data/assinatura-relatorio';
import { useElectronicSignaturesReportQuery } from '../hooks/use-electronic-signatures-report-query';
import { toAssinaturaRelatorioRow } from '../lib/to-assinatura-relatorio-row';
import { AssinaturaRelatorioStats } from './assinatura-relatorio-stats';
import { AssinaturaRelatorioTable } from './assinatura-relatorio-table';

export type AssinaturaDocumentoTipo =
  | 'todos'
  | 'anamnese'
  | 'evolucao'
  | 'contrato';

export type AssinaturaRelatorioFilters = {
  signed: boolean;
  pending: boolean;
  documentType: AssinaturaDocumentoTipo;
};

const DEFAULT_FILTERS: AssinaturaRelatorioFilters = {
  signed: false,
  pending: false,
  documentType: 'todos',
};

const DOCUMENT_TYPE_OPTIONS: {
  value: AssinaturaDocumentoTipo;
  label: string;
}[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'evolucao', label: 'Evolução' },
  { value: 'contrato', label: 'Contrato' },
];

const PER_PAGE = 10;

function resolveStatuses(
  filters: AssinaturaRelatorioFilters,
): Array<'pending' | 'signed'> | undefined {
  if (filters.signed && !filters.pending) return ['signed'];
  if (filters.pending && !filters.signed) return ['pending'];
  return undefined;
}

/** Relatório de assinaturas: filtros, KPIs e tabela via API. */
export function AssinaturaRelatorioCard() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] =
    useState<ReportPeriodFilter>(DEFAULT_REPORT_PERIOD);
  const [applied, setApplied] =
    useState<AssinaturaRelatorioFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] =
    useState<AssinaturaRelatorioFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const range = useMemo(() => resolveReportBirthdayRange(period), [period]);

  const kind =
    applied.documentType === 'todos'
      ? undefined
      : DOCUMENT_TIPO_TO_KIND[applied.documentType];

  const statuses = resolveStatuses(applied);

  useEffect(() => {
    setPage(1);
  }, [
    period,
    range.startDate,
    range.endDate,
    applied.signed,
    applied.pending,
    applied.documentType,
  ]);

  const { data, isLoading, isPending, isFetching } =
    useElectronicSignaturesReportQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      kind,
      statuses,
      page,
      perPage: PER_PAGE,
    });

  const rows = useMemo(
    () => (data?.items ?? []).map(toAssinaturaRelatorioRow),
    [data?.items],
  );

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(applied);
    }
    setOpen(next);
  }

  function handleClose() {
    setDraft(applied);
    setOpen(false);
  }

  function handleFilter() {
    setApplied(draft);
    setOpen(false);
  }

  const activeCount =
    (applied.signed ? 1 : 0) +
    (applied.pending ? 1 : 0) +
    (applied.documentType !== 'todos' ? 1 : 0);

  const loading = (isLoading || isPending || isFetching) && rows.length === 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pt-5 pb-2 space-y-0">
        <CardTitle className="text-base font-semibold">
          Relatório de assinaturas
        </CardTitle>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative h-9 shrink-0">
                <Filter className="mr-2 size-4" />
                Filtrar
                {activeCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-[min(20rem,calc(100vw-2rem))] space-y-3 p-4"
              collisionPadding={16}
            >
              <div className="space-y-2">
                <p className="text-sm font-semibold">Filtrar por</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="assinatura-filter-signed"
                      checked={draft.signed}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          signed: checked === true,
                        }))
                      }
                    />
                    <Label
                      htmlFor="assinatura-filter-signed"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Documento assinado
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="assinatura-filter-pending"
                      checked={draft.pending}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          pending: checked === true,
                        }))
                      }
                    />
                    <Label
                      htmlFor="assinatura-filter-pending"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Documento pendente
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="assinatura-filter-doc-type"
                  className="text-sm font-semibold"
                >
                  Tipo de documentos
                </Label>
                <Select
                  value={draft.documentType}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      documentType: value as AssinaturaDocumentoTipo,
                    }))
                  }
                >
                  <SelectTrigger
                    id="assinatura-filter-doc-type"
                    className="w-full"
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button type="button" onClick={handleFilter}>
                  Filtrar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as ReportPeriodFilter)}
          >
            <SelectTrigger
              className="h-9 w-[200px]"
              aria-label="Período do relatório"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5">
        <AssinaturaRelatorioStats
          stats={data?.meta.stats ?? EMPTY_ASSINATURA_RELATORIO_STATS}
        />
        <AssinaturaRelatorioTable
          rows={rows}
          page={page}
          pageCount={data?.meta.totalPages ?? 0}
          totalRowCount={data?.meta.total ?? 0}
          perPage={PER_PAGE}
          onPageChange={setPage}
          isLoading={loading}
        />
      </CardContent>
    </Card>
  );
}
