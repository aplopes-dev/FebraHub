'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
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
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { getPatientInitials } from '@/features/clinic/modules/patients/lib/patient-utils';
import { useTeamMembers } from '@/features/clinic/agenda/api/team';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import type {
  ConsultasPeriodMode,
  DashboardAppointmentGroup,
} from '../types/clinic-dashboard';
import { formatLocalDateBr } from '../lib/dashboard-dates';
import { buildPatientWhatsAppUrl } from '../lib/build-patient-whatsapp-url';
import { useDashboardAppointmentsDetailsQuery } from '../hooks/use-dashboard-appointments-details-query';

const PAGE_SIZE = 20;

type DashboardAppointmentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  group: DashboardAppointmentGroup | null;
  periodMode: ConsultasPeriodMode;
  year: number;
  month?: number;
  categoryId: string;
};

export function DashboardAppointmentsDialog({
  open,
  onOpenChange,
  title,
  group,
  periodMode,
  year,
  month,
  categoryId,
}: DashboardAppointmentsDialogProps) {
  const [page, setPage] = useState(1);
  const { data: teamData } = useTeamMembers();

  const professionalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of teamData?.professionals ?? []) {
      map.set(member.id, member.name);
      if (member.userId) map.set(member.userId, member.name);
    }
    return map;
  }, [teamData?.professionals]);

  useEffect(() => {
    setPage(1);
  }, [group, periodMode, year, month, categoryId]);

  const { items, meta, isLoading, isError } =
    useDashboardAppointmentsDetailsQuery(
      {
        group: group ?? 'realized',
        periodMode,
        year,
        month,
        categoryId,
        page,
        perPage: PAGE_SIZE,
      },
      { enabled: open && group != null },
    );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setPage(1);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-[calc(100%-1.5rem)] flex-col gap-0 p-0 sm:w-full sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-4 py-4 sm:px-6">
          <DialogTitle className="min-w-0 text-pretty">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Pacientes das consultas filtradas do agrupamento selecionado.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando consultas…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar as consultas.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </p>
          ) : (
            items.map((appointment) => {
              const whatsappUrl = buildPatientWhatsAppUrl(
                appointment.phone,
                appointment.patientName,
              );
              const professionalName =
                professionalNameById.get(appointment.professionalId) ?? '—';
              return (
                <article
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 px-3 py-3 lg:grid lg:grid-cols-3 lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-11 shrink-0" aria-hidden="true">
                      <AvatarFallback>
                        {getPatientInitials(appointment.patientName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/pacientes/${appointment.patientId}/sobre`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-words font-medium text-primary underline underline-offset-4 hover:no-underline"
                      >
                        {appointment.patientName}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </Link>
                      <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-4 shrink-0" aria-hidden />
                        <span className="break-words">
                          {formatPhone(appointment.phone) || 'Sem telefone'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-left lg:justify-self-center">
                    <p className="text-sm tabular-nums text-black">
                      {formatLocalDateBr(appointment.date)}
                    </p>
                    <p className="break-words text-sm text-muted-foreground">
                      {`Por ${professionalName}`}
                    </p>
                  </div>
                  <div className="lg:justify-self-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full shrink-0 sm:w-auto"
                      disabled={!whatsappUrl}
                      aria-label={`Conversar com ${appointment.patientName} pelo WhatsApp`}
                      onClick={() =>
                        handleWhatsApp(
                          appointment.phone,
                          appointment.patientName,
                        )
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
        <Separator />
        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 px-4 py-4 sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={page <= 1 || isLoading}
              aria-label="Página anterior"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {meta.totalPages === 0
                ? '0 / 0'
                : `${meta.page} / ${meta.totalPages}`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={
                isLoading ||
                meta.totalPages === 0 ||
                page >= meta.totalPages
              }
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
