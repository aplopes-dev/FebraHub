'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CircleAlert, EllipsisVertical, Trash2 } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@citybox/ui/atoms';
import type { IReturnAlert } from '@/features/clinic/agenda/components/header/return-alert/types';
import { formatPatientPhone } from '../../lib/format-patient-contact';
import { getPatientInitials } from '../../lib/patient-utils';

type PatientReturnAlertCardProps = {
  alert: IReturnAlert;
  patientName: string;
  patientPhone?: string | null;
  patientPhotoUrl?: string | null;
  professionalName: string;
  onSchedule?: (alert: IReturnAlert) => void;
  onDelete?: (alert: IReturnAlert) => void;
};

function formatReturnAlertDate(returnDate: string): string {
  return format(new Date(returnDate), 'dd/MM/yyyy', { locale: ptBR });
}

export function PatientReturnAlertCard({
  alert,
  patientName,
  patientPhone,
  patientPhotoUrl,
  professionalName,
  onSchedule,
  onDelete,
}: PatientReturnAlertCardProps) {
  const displayName = alert.patient.name || patientName;
  const displayPhone = formatPatientPhone(alert.patient.phone || patientPhone || '');
  const observation = alert.reason?.trim() || 'Nenhuma observação registrada para este alerta.';

  return (
    <li className="rounded-lg border border-border/60 bg-background p-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,140px)_auto] grid-rows-2 items-center gap-x-3 gap-y-0.5">
        <Avatar className="row-span-2 size-10 shrink-0">
          {patientPhotoUrl ? <AvatarImage src={patientPhotoUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-sm">{getPatientInitials(displayName)}</AvatarFallback>
        </Avatar>

        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
        <p className="text-sm font-medium text-foreground">
          {formatReturnAlertDate(alert.returnDate)}
        </p>

        <div className="row-span-2 flex shrink-0 items-center gap-0.5 self-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Ver observação do alerta"
              >
                <CircleAlert className="size-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={6} className="max-w-xs">
              <p className="text-pretty">{observation}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Ações do alerta de retorno"
              >
                <EllipsisVertical className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSchedule?.(alert)}>
                <Calendar className="size-4" />
                Agendar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(alert)}>
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="truncate text-xs text-muted-foreground">{displayPhone || '—'}</p>
        <p className="truncate text-xs text-muted-foreground">{professionalName}</p>
      </div>
    </li>
  );
}
