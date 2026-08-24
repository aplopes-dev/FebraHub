'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  IdCard,
  Mail,
  Phone,
  Search,
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
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { getPatientInitials } from '@/features/clinic/modules/patients/lib/patient-utils';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { useDebouncedSearch } from '@/features/clinic/modules/patients/hooks/use-debounced-search';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type {
  DashboardAcquisitionPatient,
  DashboardAcquisitionPeriodMode,
  DashboardReferralSourceKey,
} from '../types/clinic-dashboard';
import { buildPatientWhatsAppUrl } from '../lib/build-patient-whatsapp-url';
import { getDashboardReferralSourceLabel } from '../lib/patient-acquisition';
import {
  buildDashboardPatientAcquisitionDetailPdf,
  buildDashboardPatientAcquisitionDetailPdfFileName,
  mapClinicSettingsToPatientAcquisitionPdfClinic,
} from '../lib/build-dashboard-patient-acquisition-pdf';
import { useDashboardPatientAcquisitionDetailsQuery } from '../hooks/use-dashboard-patient-acquisition-details-query';
import { fetchDashboardPatientAcquisitionDetails } from '../services/dashboard.api.service';

const PAGE_SIZE = 20;

type DashboardPatientAcquisitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DashboardReferralSourceKey | null;
  periodMode: DashboardAcquisitionPeriodMode;
  year: number;
  month?: number;
  periodLabel: string;
};

export function DashboardPatientAcquisitionDialog({
  open,
  onOpenChange,
  source,
  periodMode,
  year,
  month,
  periodLabel,
}: DashboardPatientAcquisitionDialogProps) {
  const { clinicId } = useClinicId();
  const [page, setPage] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();

  useEffect(() => {
    setPage(1);
  }, [source, periodMode, year, month, debouncedSearch]);

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardPatientAcquisitionDetailsQuery(
      {
        source: source ?? 'outro',
        periodMode,
        year,
        month,
        page,
        perPage: PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
      { enabled: open && source != null },
    );

  const sourceLabel = source
    ? getDashboardReferralSourceLabel(source)
    : null;

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

  const handleExport = async () => {
    if (!source || !clinicId) return;
    setIsExporting(true);
    try {
      const all: DashboardAcquisitionPatient[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const result = await fetchDashboardPatientAcquisitionDetails(clinicId, {
          source,
          periodMode,
          year,
          month,
          page: currentPage,
          perPage: 100,
          search: debouncedSearch || undefined,
        });
        all.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const label = getDashboardReferralSourceLabel(source);
      const blob = await buildDashboardPatientAcquisitionDetailPdf({
        sourceLabel: label,
        periodLabel,
        patients: all,
        clinic: mapClinicSettingsToPatientAcquisitionPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildDashboardPatientAcquisitionDetailPdfFileName(label),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
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
            <DialogTitle>
              Como o paciente chegou na clínica
              {sourceLabel ? (
                <>
                  {' - '}
                  <span className="text-primary">{sourceLabel}</span>
                </>
              ) : null}
            </DialogTitle>
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
                disabled={isExporting || meta.total === 0}
                onClick={() => void handleExport()}
              >
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Lista dos pacientes que chegaram por esta origem.
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
              return (
                <article
                  key={patient.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-3"
                >
                  <Avatar className="size-11 shrink-0" aria-hidden="true">
                    <AvatarFallback>
                      {getPatientInitials(patient.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pacientes/${patient.id}/sobre`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                    >
                      {patient.name}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Phone className="size-4 shrink-0" aria-hidden />
                        {formatPhone(patient.phone) || 'Sem telefone'}
                      </span>
                      {patient.email ? (
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Mail className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">{patient.email}</span>
                        </span>
                      ) : null}
                      {patient.cpf ? (
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <IdCard className="size-4 shrink-0" aria-hidden />
                          {patient.cpf}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!whatsappUrl}
                    aria-label={`Conversar com ${patient.name} pelo WhatsApp`}
                    onClick={() => handleWhatsApp(patient.phone, patient.name)}
                  >
                    <WhatsappBrandIcon className="size-4" />
                    Conversar
                  </Button>
                </article>
              );
            })
          )}
        </div>

        <Separator className="shrink-0" />
        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {!isLoading && !isError
              ? `${meta.total} paciente(s)${isFetching ? ' · atualizando…' : ''}`
              : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {meta.totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev || isLoading}
                  aria-label="Página anterior"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {page} / {Math.max(meta.totalPages, 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext || isLoading}
                  aria-label="Próxima página"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(meta.totalPages, 1), current + 1),
                    )
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
