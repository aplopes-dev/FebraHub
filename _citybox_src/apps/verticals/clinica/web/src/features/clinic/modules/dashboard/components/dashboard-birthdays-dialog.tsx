'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
} from '@citybox/ui/atoms';
import { DatePicker, SearchInput } from '@citybox/ui/molecules';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { mapClinicSettingsToPdfClinic } from '@/features/clinic/modules/patients/lib/patient-pdf-shared';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import { getPatientInitials } from '@/features/clinic/modules/patients/lib/patient-utils';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { useDebouncedSearch } from '@/features/clinic/modules/patients/hooks/use-debounced-search';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type { BirthdayPeriodFilter } from '../types/clinic-dashboard';
import { BIRTHDAY_PERIOD_OPTIONS, formatBirthdayPdfPeriodLabel } from '../lib/birthday-period';
import {
  buildDashboardBirthdaysPdf,
  buildDashboardBirthdaysPdfFileName,
} from '../lib/build-dashboard-birthdays-pdf';
import { buildBirthdayWhatsAppUrl } from '../lib/build-birthday-whatsapp-url';
import { formatLocalDateBr } from '../lib/dashboard-dates';
import { useDashboardBirthdaysQuery } from '../hooks/use-dashboard-birthdays-query';
import { fetchDashboardBirthdays } from '../services/dashboard.api.service';

const PAGE_SIZE = 20;

type DashboardBirthdaysDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardBirthdaysDialog({
  open,
  onOpenChange,
}: DashboardBirthdaysDialogProps) {
  const { clinicId } = useClinicId();
  const [period, setPeriod] = useState<BirthdayPeriodFilter>('next_30_days');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();

  useEffect(() => {
    setPage(1);
  }, [period, customStart, customEnd, debouncedSearch]);

  const customStartIso =
    period === 'custom' && customStart
      ? formatLocalDateString(customStart)
      : undefined;
  const customEndIso =
    period === 'custom' && customEnd
      ? formatLocalDateString(customEnd)
      : undefined;

  const customReady =
    period !== 'custom' || Boolean(customStartIso && customEndIso);

  const queryParams = useMemo(
    () => ({
      period,
      startDate: customStartIso,
      endDate: customEndIso,
      page,
      perPage: PAGE_SIZE,
      search: debouncedSearch || undefined,
    }),
    [period, customStartIso, customEndIso, page, debouncedSearch],
  );

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardBirthdaysQuery(queryParams, {
      enabled: open && customReady,
    });

  const periodLabel = formatBirthdayPdfPeriodLabel(
    period,
    new Date(),
    customStart,
    customEnd,
  );

  const handleExport = async () => {
    if (!clinicId || !customReady) return;
    setIsExporting(true);
    try {
      const allItems: Awaited<
        ReturnType<typeof fetchDashboardBirthdays>
      >['items'] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const result = await fetchDashboardBirthdays(clinicId, {
          period,
          startDate: customStartIso,
          endDate: customEndIso,
          page: currentPage,
          perPage: 100,
          search: debouncedSearch || undefined,
        });
        allItems.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardBirthdaysPdf({
        items: allItems,
        periodLabel,
        clinic: mapClinicSettingsToPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildDashboardBirthdaysPdfFileName());
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const url = buildBirthdayWhatsAppUrl(phone, name);
    if (!url) {
      toast.error('Paciente sem telefone cadastrado');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPeriod('next_30_days');
      setCustomStart(undefined);
      setCustomEnd(undefined);
      setIsSearchOpen(false);
      clearSearch();
      setPage(1);
    }
    onOpenChange(nextOpen);
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
            <DialogTitle>Aniversariantes</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              {isSearchOpen ? (
                <>
                  <SearchInput
                    autoFocus
                    value={search}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Buscar paciente…"
                    aria-label="Buscar aniversariante"
                    containerClassName="w-52"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar busca de aniversariante"
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
                  aria-label="Abrir busca"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="size-4" />
                </Button>
              )}
              <Select
                value={period}
                onValueChange={(value) =>
                  setPeriod(value as BirthdayPeriodFilter)
                }
              >
                <SelectTrigger
                  className="w-52"
                  aria-label="Período dos aniversariantes"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BIRTHDAY_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {period === 'custom' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <Label className="sr-only">Data inicial</Label>
                    <DatePicker
                      value={customStart}
                      onChange={setCustomStart}
                      className="w-36"
                      aria-label="Data inicial"
                      placeholder="Data inicial"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="sr-only">Data final</Label>
                    <DatePicker
                      value={customEnd}
                      onChange={setCustomEnd}
                      className="w-36"
                      aria-label="Data final"
                      placeholder="Data final"
                    />
                  </div>
                </>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isExporting || meta.total === 0 || !customReady || isLoading
                }
                onClick={() => void handleExport()}
              >
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Lista de aniversariantes filtrada por período.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {!customReady ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Selecione a data inicial e a data final.
            </p>
          ) : isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando aniversariantes…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os aniversariantes.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum aniversariante no período selecionado.
            </p>
          ) : (
            items.map((item) => {
              const whatsappUrl = buildBirthdayWhatsAppUrl(
                item.phone,
                item.name,
              );
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border/50 px-3 py-3"
                >
                  <Avatar className="size-11 shrink-0">
                    {item.photoUrl ? (
                      <AvatarImage src={item.photoUrl} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {getPatientInitials(item.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/pacientes/${item.id}/sobre`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                      >
                        {item.name}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </Link>
                      <div className="mt-1.5 flex flex-col gap-1.5 text-sm text-muted-foreground sm:mt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Phone className="size-4 shrink-0" aria-hidden />
                          <span className="break-all">
                            {formatPhone(item.phone) || 'Sem telefone'}
                          </span>
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <CalendarDays
                            className="size-4 shrink-0"
                            aria-hidden
                          />
                          <span className="tabular-nums">
                            {`${formatLocalDateBr(item.birthDate)} - ${item.relativeLabel}`}
                          </span>
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start"
                      disabled={!whatsappUrl}
                      aria-label={`Conversar com ${item.name} pelo WhatsApp`}
                      onClick={() => handleWhatsApp(item.phone, item.name)}
                    >
                      <WhatsappBrandIcon className="size-4" />
                      Conversar
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {customReady && !isLoading && !isError
              ? `${meta.total} aniversariante(s)${isFetching ? ' · atualizando…' : ''}`
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
