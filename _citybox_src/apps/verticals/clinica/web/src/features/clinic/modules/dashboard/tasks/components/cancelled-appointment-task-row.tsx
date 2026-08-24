'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Phone } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import {
  formatClinicTimeFromIso,
  parseClinicDateTimeIso,
} from '@/features/clinic/agenda/lib/clinic-datetime';
import { getPatientInitials } from '@/features/clinic/modules/patients/lib/patient-utils';
import { buildPatientWhatsAppUrl } from '@/features/clinic/modules/dashboard/lib/build-patient-whatsapp-url';
import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

type CancelledAppointmentTaskRowProps = {
  task: CancelledAppointmentTask;
  onReschedule: (task: CancelledAppointmentTask) => void;
  onIgnore: (task: CancelledAppointmentTask) => void;
};

export function CancelledAppointmentTaskRow({
  task,
  onReschedule,
  onIgnore,
}: CancelledAppointmentTaskRowProps) {
  const appointmentDate = parseClinicDateTimeIso(task.appointmentAt);
  const dateLabelShort = format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR });
  const dateLabelLong = format(appointmentDate, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const timeLabel = formatClinicTimeFromIso(task.appointmentAt);
  const whatsappUrl = buildPatientWhatsAppUrl(task.patientPhone, task.patientName);

  return (
    <div className="flex items-center gap-2 border-b border-border/60 py-3 last:border-b-0 sm:gap-3 sm:py-4">
      <Avatar
        className="hidden size-11 shrink-0 sm:flex"
        aria-hidden="true"
      >
        <AvatarFallback>{getPatientInitials(task.patientName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 basis-[42%] space-y-0.5">
        <p className="truncate text-xs font-medium text-foreground sm:text-sm">
          {task.patientName}
        </p>
        <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground sm:gap-1.5 sm:text-sm">
          <Phone className="size-3 shrink-0 sm:size-3.5" aria-hidden />
          <span className="truncate">
            {formatPhoneDisplay(task.patientPhone)}
          </span>
        </p>
      </div>

      <div className="min-w-0 flex-1 basis-[42%] space-y-0.5">
        <p className="truncate text-xs text-foreground sm:text-sm">
          <span className="sm:hidden">
            {dateLabelShort}
            <span className="text-muted-foreground"> · {timeLabel}</span>
          </span>
          <span className="hidden sm:inline">
            {dateLabelLong}
            <span className="text-muted-foreground"> · {timeLabel}</span>
          </span>
        </p>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          {task.professionalName}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={`Ações para ${task.patientName}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            disabled={!whatsappUrl}
            onSelect={() => {
              if (!whatsappUrl) return;
              window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            Conversar no WhatsApp Web
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onReschedule(task)}>
            Reagendar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onIgnore(task)}>
            Ignorar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
