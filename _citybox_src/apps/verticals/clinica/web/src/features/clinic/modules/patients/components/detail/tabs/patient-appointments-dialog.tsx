'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';
import { usePatientAppointmentsQuery } from '../../../hooks/use-patient-appointments-query';
import {
  buildAgendaDateHref,
  formatPatientAppointmentStatus,
  formatPatientAppointmentWhen,
  getPatientAppointmentStatusTextClass,
} from '../../../lib/format-patient-appointment';

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

type PatientAppointmentsDialogProps = {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 2) {
    return page === 1 ? [1, 'ellipsis', totalPages] : [1, 2, 'ellipsis', totalPages];
  }
  if (page >= totalPages - 1) {
    return page === totalPages
      ? [1, 'ellipsis', totalPages]
      : [1, 'ellipsis', totalPages - 1, totalPages];
  }
  return [1, 'ellipsis', page, 'ellipsis', totalPages];
}

export function PatientAppointmentsDialog({
  patientId,
  open,
  onOpenChange,
}: PatientAppointmentsDialogProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const { items, meta, isLoading, isError, isFetching } = usePatientAppointmentsQuery(
    open ? patientId : null,
    { page, perPage },
  );

  const totalPages = Math.max(meta.totalPages, 1);
  const visiblePages = getVisiblePages(page, totalPages);
  const start = meta.total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, meta.total);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPage(1);
          setPerPage(10);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,40rem)] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-5">
          <DialogTitle>Todas as consultas</DialogTitle>
          <DialogDescription>
            Histórico completo de consultas deste paciente (agendadas, confirmadas,
            canceladas e finalizadas).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Carregando consultas…
            </p>
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Não foi possível carregar as consultas.
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma consulta registrada.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {formatPatientAppointmentWhen(item.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.professionalDisplayName}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'justify-self-center pt-0.5 text-center text-sm font-medium',
                      getPatientAppointmentStatusTextClass(item.status),
                    )}
                  >
                    {formatPatientAppointmentStatus(
                      item.status,
                      item.confirmationSource,
                    )}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-8 shrink-0 px-0 text-primary"
                      onClick={() => router.push(buildAgendaDateHref(item.date))}
                    >
                      Ver na Agenda
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {meta.total > 0 ? (
          <div className="grid shrink-0 grid-cols-1 items-center gap-3 border-t border-border/60 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
            <p className="justify-self-start whitespace-nowrap text-sm text-muted-foreground">
              {start}–{end} de {meta.total}
              {isFetching && !isLoading ? ' · atualizando…' : ''}
            </p>

            <Pagination className="mx-0 w-auto justify-center sm:justify-self-center">
              <PaginationContent className="flex-nowrap gap-0.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.max(1, current - 1));
                    }}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                {visiblePages.map((entry, index) =>
                  entry === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={entry}>
                      <PaginationLink
                        href="#"
                        isActive={entry === page}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(entry);
                        }}
                      >
                        {entry}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage((current) => Math.min(totalPages, current + 1));
                    }}
                    aria-disabled={page >= totalPages}
                    className={
                      page >= totalPages ? 'pointer-events-none opacity-50' : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="flex shrink-0 items-center gap-2 sm:justify-self-end">
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                Por página
              </span>
              <Select
                value={String(perPage)}
                onValueChange={(value) => {
                  setPerPage(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-t border-border/60 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
