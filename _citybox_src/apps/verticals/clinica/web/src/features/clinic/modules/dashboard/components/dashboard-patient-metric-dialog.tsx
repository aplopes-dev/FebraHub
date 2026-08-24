'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  IdCard,
  Mail,
  Phone,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { getPatientInitials } from '@/features/clinic/modules/patients/lib/patient-utils';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { mapClinicSettingsToPdfClinic } from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { useDebouncedSearch } from '@/features/clinic/modules/patients/hooks/use-debounced-search';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type { DashboardPatientsListMetricId } from '../types/clinic-dashboard';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import {
  buildDashboardPatientMetricPdf,
  buildDashboardPatientMetricPdfFileName,
} from '../lib/build-dashboard-patient-metric-pdf';
import { buildPatientWhatsAppUrl } from '../lib/build-patient-whatsapp-url';
import {
  formatDashboardLandlinePhone,
  formatDashboardMobilePhone,
  formatDashboardPatientCpfLabel,
} from '../lib/format-dashboard-patient-contact';
import { useDashboardPatientsMetricListQuery } from '../hooks/use-dashboard-patients-metric-list-query';
import { fetchDashboardPatientsByMetric } from '../services/dashboard.api.service';

const PAGE_SIZE = 20;

type DashboardPatientMetricDialogProps = {
  metricId: DashboardPatientsListMetricId | null;
  metricLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardPatientMetricDialog({
  metricId,
  metricLabel,
  open,
  onOpenChange,
}: DashboardPatientMetricDialogProps) {
  const { clinicId } = useClinicId();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, metricId]);

  const queryParams = useMemo(
    () => ({
      metric: metricId ?? 'total_registered',
      page,
      perPage: PAGE_SIZE,
      search: debouncedSearch || undefined,
    }),
    [metricId, page, debouncedSearch],
  );

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardPatientsMetricListQuery(queryParams, {
      enabled: open && metricId !== null,
    });

  const showsOverdueValue = metricId === 'overdue_debts';

  const handleExport = async () => {
    if (!clinicId || !metricId) return;
    setIsExporting(true);
    try {
      const allItems: Awaited<
        ReturnType<typeof fetchDashboardPatientsByMetric>
      >['items'] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const result = await fetchDashboardPatientsByMetric(clinicId, {
          metric: metricId,
          page: currentPage,
          perPage: 100,
          search: debouncedSearch || undefined,
        });
        allItems.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardPatientMetricPdf({
        metricLabel,
        patients: allItems,
        showValueColumn: showsOverdueValue,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardPatientMetricPdfFileName(metricLabel),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsSearchOpen(false);
      clearSearch();
      setPage(1);
    }
    onOpenChange(nextOpen);
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const url = buildPatientWhatsAppUrl(phone, name);
    if (!url) {
      toast.error('Paciente sem telefone cadastrado');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const canGoPrev = page > 1;
  const canGoNext = page < Math.max(meta.totalPages, 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-full flex-col gap-0 p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle>{metricLabel}</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              {isSearchOpen ? (
                <>
                  <SearchInput
                    autoFocus
                    value={search}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Buscar paciente…"
                    aria-label="Buscar paciente"
                    containerClassName="w-56"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar busca de paciente"
                    onClick={() => {
                      clearSearch();
                      setIsSearchOpen(false);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Abrir busca de paciente"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isExporting || isLoading || isError || meta.total === 0
                }
                onClick={() => void handleExport()}
              >
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Lista dos pacientes da categoria selecionada.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando pacientes…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os pacientes.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </p>
          ) : (
            items.map((patient) => {
              const whatsappUrl = buildPatientWhatsAppUrl(
                patient.phone,
                patient.name,
              );
              const landlineLabel = formatDashboardLandlinePhone(
                patient.landlinePhone,
              );
              const mobileLabel = formatDashboardMobilePhone(patient.phone);
              const cpfLabel = formatDashboardPatientCpfLabel(patient.cpf);
              return (
                <article
                  key={patient.id}
                  className="flex items-start gap-3 rounded-xl border border-border/50 px-3 py-3"
                >
                  <Avatar className="size-11 shrink-0" aria-hidden="true">
                    <AvatarFallback>
                      {getPatientInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/pacientes/${patient.id}/sobre`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                      >
                        {patient.name}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </Link>
                      <div className="mt-1.5 flex flex-col gap-1.5 text-sm text-muted-foreground sm:mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                        {landlineLabel ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Phone className="size-4 shrink-0" aria-hidden />
                            <span className="break-all">{landlineLabel}</span>
                          </span>
                        ) : null}
                        {mobileLabel ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Smartphone
                              className="size-4 shrink-0"
                              aria-hidden
                            />
                            <span className="break-all">{mobileLabel}</span>
                          </span>
                        ) : null}
                        {patient.email ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Mail className="size-4 shrink-0" aria-hidden />
                            <span className="break-all">{patient.email}</span>
                          </span>
                        ) : null}
                        {cpfLabel ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <IdCard className="size-4 shrink-0" aria-hidden />
                            <span className="break-all">{cpfLabel}</span>
                          </span>
                        ) : null}
                      </div>
                      {showsOverdueValue ? (
                        <p
                          className="mt-2 text-sm font-semibold tabular-nums text-foreground"
                          aria-label={`Valor em atraso: ${formatDashboardCurrencyFromCents(
                            patient.valueCents ?? 0,
                          )}`}
                        >
                          {formatDashboardCurrencyFromCents(
                            patient.valueCents ?? 0,
                          )}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start"
                      disabled={!whatsappUrl}
                      aria-label={`Conversar com ${patient.name} pelo WhatsApp`}
                      onClick={() =>
                        handleWhatsApp(patient.phone, patient.name)
                      }
                    >
                      <WhatsappBrandIcon className="size-4" />
                      Conversar
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <Separator className="shrink-0" />
        <DialogFooter className="shrink-0 flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canGoPrev || isFetching}
              aria-label="Página anterior"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span>
              Página {meta.page} de {Math.max(meta.totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canGoNext || isFetching}
              aria-label="Próxima página"
              onClick={() => setPage((current) => current + 1)}
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
