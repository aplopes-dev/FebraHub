"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, CalendarClock, FileText, Info, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@citybox/ui/atoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@citybox/ui/atoms";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";

import { dateLocale } from "@/features/clinic/agenda/lib/date-locale";
import {
  formatClinicDateFromIso,
  formatClinicTimeFromIso,
  parseClinicDateTimeIso,
} from "@/features/clinic/agenda/lib/clinic-datetime";
import {
  fromUiAppointmentStatus,
  getAppointmentStatusDisplayLabel,
  isCancelledOrMissedAppointmentStatus,
  isConfirmedAppointmentStatus,
  toUiAppointmentStatus,
  type UiAppointmentStatus,
} from "@/features/clinic/agenda/utils/calendar-transform";
import { canTransitionAppointmentStatus } from "@/features/clinic/agenda/utils/appointment-status-transitions";
import { useCalendar } from "@/features/clinic/agenda/contexts/calendar-context";
import { useSchedulePermissions } from "@/features/clinic/agenda/hooks/use-schedule-permissions";
import { useSchedulingSheet } from "../../contexts/scheduling-sheet-context";
import {
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from "../../hooks/use-appointments";
import { useDeleteCommitment } from "../../hooks/use-commitments";
import { toastClinicaMutationError } from "@/features/clinic/shared/api";

import type { IEvent } from "@/features/clinic/agenda/interfaces";
import type { AppointmentStatus } from "@/features/clinic/agenda/api/types";

type EventDetailsPopoverProps = {
  event: IEvent;
  children: React.ReactNode;
};

const statusOptions: Array<{ value: UiAppointmentStatus; label: string }> = [
  { value: "scheduled", label: "Agendada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "confirmed_whatsapp", label: "Confirmada por mensagem" },
  { value: "in_progress", label: "Em Atendimento" },
  { value: "patient_waiting", label: "Paciente aguardando" },
  { value: "finished", label: "Finalizada" },
  { value: "missed", label: "Falta" },
  { value: "cancelled_patient", label: "Cancelada pelo paciente" },
  { value: "cancelled_pro", label: "Cancelada pelo profissional" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Formata "2026-08-26T00:00:00.000Z" → "26/08/2026" sem shift de fuso */
function formatISODateLocal(isoString: string): string {
  const datePart = isoString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
}

function resolveHeaderClass(
  isAppointment: boolean,
  uiStatus: UiAppointmentStatus,
): string {
  if (isAppointment && isCancelledOrMissedAppointmentStatus(uiStatus)) {
    return "bg-red-400";
  }
  if (isAppointment && isConfirmedAppointmentStatus(uiStatus)) {
    return "bg-green-400";
  }
  return "bg-primary";
}

export function EventDetailsPopover({
  event,
  children,
}: EventDetailsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [uiStatus, setUiStatus] = useState<UiAppointmentStatus>(() =>
    toUiAppointmentStatus(
      event.appointmentStatus,
      event.rawAppointment?.confirmationSource,
    ),
  );

  const { setLocalEvents } = useCalendar();
  const { openSheet } = useSchedulingSheet();
  const { canDelete, canAttend, canCreateForOthers } = useSchedulePermissions();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const deleteCommitment = useDeleteCommitment();

  const isAppointment = event.eventType === "appointment";
  const canEditEvent = canAttend || canCreateForOthers;
  const eventId = String(event.id);
  const rawAppt = event.rawAppointment;

  useEffect(() => {
    setUiStatus(
      toUiAppointmentStatus(
        event.appointmentStatus,
        rawAppt?.confirmationSource,
      ),
    );
  }, [event.id, event.appointmentStatus, rawAppt?.confirmationSource]);

  const startDate = parseClinicDateTimeIso(event.startDate);

  function applyLocalStatus(
    status: AppointmentStatus,
    confirmationSource: "manual" | "whatsapp" | null,
  ) {
    setLocalEvents((prev) =>
      prev.map((item) => {
        if (String(item.id) !== eventId) return item;
        const nextColor = isConfirmedAppointmentStatus(status)
          ? "green"
          : isCancelledOrMissedAppointmentStatus(status)
            ? "red"
            : status === "scheduled"
              ? "blue"
              : item.color;
        return {
          ...item,
          appointmentStatus: status,
          color: nextColor,
          rawAppointment: item.rawAppointment
            ? {
                ...item.rawAppointment,
                status,
                confirmationSource,
              }
            : item.rawAppointment,
        };
      }),
    );
  }

  function handleEdit() {
    setIsOpen(false);

    if (isAppointment && rawAppt) {
      openSheet({
        id: String(rawAppt.id),
        type: "appointment",
        patientId: rawAppt.patientId,
        patientName: rawAppt.patient?.name,
        professionalId: rawAppt.professionalId,
        categoryId: rawAppt.categoryId,
        date: formatClinicDateFromIso(event.startDate),
        startTime: formatClinicTimeFromIso(event.startDate),
        durationMinutes: rawAppt.durationMin,
        observation: rawAppt.observations || "",
        returnOption: rawAppt.returnOption || "none",
        returnDate: rawAppt.returnDate ? rawAppt.returnDate.split("T")[0] : "",
        returnReason: rawAppt.returnReason || "",
      }, "edit");
    } else if (!isAppointment && event.rawCommitment) {
      openSheet({
        id: String(event.rawCommitment.id),
        type: "commitment",
        title: event.rawCommitment.title,
        description: event.rawCommitment.description || "",
        professionalId: event.rawCommitment.professionalId,
        isAllDay: event.rawCommitment.allDay,
        startDate: formatClinicDateFromIso(event.startDate),
        startTime: event.rawCommitment.allDay ? "" : formatClinicTimeFromIso(event.startDate),
        endDate: formatClinicDateFromIso(event.endDate),
        endTime: event.rawCommitment.allDay ? "" : formatClinicTimeFromIso(event.endDate),
        repeat: event.rawCommitment.recurring,
        repeatFrequency: event.rawCommitment.recurrenceType || undefined,
        repeatEndType: event.rawCommitment.recurrenceEnd || undefined,
        repeatEndDate: event.rawCommitment.recurrenceEndDate
          ? format(parseISO(event.rawCommitment.recurrenceEndDate), "yyyy-MM-dd")
          : "",
        availability: event.rawCommitment.availability,
        privacy: event.rawCommitment.privacy,
      }, "edit");
    } else {
      openSheet({
        date: formatClinicDateFromIso(event.startDate),
        startTime: formatClinicTimeFromIso(event.startDate),
      });
    }
  }

  function handleStatusChange(value: string) {
    const previous = uiStatus;
    const nextUi = value as UiAppointmentStatus;
    const { status, confirmationSource } = fromUiAppointmentStatus(nextUi);
    const currentApiStatus = fromUiAppointmentStatus(previous).status;
    if (!canTransitionAppointmentStatus(currentApiStatus, status)) {
      toast.error(
        "Não é possível alterar para este status a partir do status atual.",
      );
      return;
    }
    setUiStatus(nextUi);
    applyLocalStatus(status, confirmationSource);
    updateStatus.mutate(
      { id: eventId, status, confirmationSource },
      {
        onError: (error) => {
          setUiStatus(previous);
          const rollback = fromUiAppointmentStatus(previous);
          applyLocalStatus(rollback.status, rollback.confirmationSource);
          toastClinicaMutationError(error, "Erro ao atualizar status");
        },
      },
    );
  }

  function handleDelete() {
    if (isAppointment) {
      deleteAppointment.mutate(eventId, {
        onSuccess: () => {
          toast.success("Consulta excluída com sucesso");
          setIsOpen(false);
          setConfirmDeleteOpen(false);
        },
        onError: () => {
          toast.error("Erro ao excluir consulta");
        },
      });
    } else {
      deleteCommitment.mutate(eventId, {
        onSuccess: () => {
          toast.success("Compromisso excluído com sucesso");
          setIsOpen(false);
          setConfirmDeleteOpen(false);
        },
        onError: () => {
          toast.error("Erro ao excluir compromisso");
        },
      });
    }
  }

  const isDeleting = deleteAppointment.isPending || deleteCommitment.isPending;

  const createdAtFormatted = rawAppt?.createdAt
    ? format(parseISO(rawAppt.createdAt), "dd/MM/yyyy", { locale: dateLocale })
    : null;

  const returnDateFormatted = rawAppt?.returnDate
    ? formatISODateLocal(rawAppt.returnDate)
    : null;

  const headerClass = resolveHeaderClass(isAppointment, uiStatus);
  const currentApiStatus = fromUiAppointmentStatus(uiStatus).status;
  const visibleStatusOptions = statusOptions.filter((option) => {
    const next = fromUiAppointmentStatus(option.value).status;
    return canTransitionAppointmentStatus(currentApiStatus, next);
  });
  const statusDisplayLabel = getAppointmentStatusDisplayLabel(
    uiStatus === "confirmed_whatsapp" ? "confirmed" : uiStatus,
    uiStatus === "confirmed_whatsapp" ? "whatsapp" : uiStatus === "confirmed" ? "manual" : null,
  );

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-96 p-0 overflow-hidden" align="start">
          {/* Header */}
          <div
            className={cn(
              "p-4 text-primary-foreground",
              headerClass,
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-primary-foreground/20">
                  <AvatarImage src={undefined} alt={event.title} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                    {getInitials(event.title)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{event.title}</p>
                  <p className="text-sm opacity-75">
                    {isAppointment ? "Atendimento" : "Compromisso"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canEditEvent ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/30"
                    onClick={handleEdit}
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/30"
                    onClick={() => {
                      setIsOpen(false);
                      setConfirmDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/30"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Calendar className="size-4" />
              <span>
                {format(startDate, "d 'de' MMM, yyyy", { locale: dateLocale })}{" "}
                • {formatClinicTimeFromIso(event.startDate)} - {formatClinicTimeFromIso(event.endDate)}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-background">
            {/* Status (somente consultas) */}
            {isAppointment && (
              <div className="pb-1">
                <div className="flex flex-col gap-1.5">
                  <Label className={cn(updateStatus.isPending && "opacity-50")}>
                    Status
                  </Label>
                  <Select
                    value={uiStatus}
                    onValueChange={handleStatusChange}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione">
                        {statusDisplayLabel}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {visibleStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Profissional + ícone de info */}
            <div className="flex items-center gap-3">
              <Avatar className="size-7 shrink-0">
                <AvatarImage
                  src={event.user.picturePath ?? undefined}
                  alt={event.user.name}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(event.user.name || "?")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm flex-1">
                {event.user.name || "Profissional"}
              </span>
              {isAppointment && createdAtFormatted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Consulta criada em {createdAtFormatted}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Alerta de retorno */}
            {isAppointment && returnDateFormatted && (
              <div className="flex items-start gap-3">
                <div className="w-7 flex justify-center shrink-0">
                  <CalendarClock className="size-4 text-muted-foreground mt-0.5" />
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>Retorno para {returnDateFormatted}</span>
                  {rawAppt?.returnReason && (
                    <span className="block text-xs mt-0.5">{rawAppt.returnReason}</span>
                  )}
                </div>
              </div>
            )}

            {/* Observações */}
            {isAppointment && rawAppt?.observations && (
              <div className="flex items-start gap-3">
                <div className="w-7 flex justify-center shrink-0">
                  <FileText className="size-4 text-muted-foreground mt-0.5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {rawAppt.observations}
                </p>
              </div>
            )}

            {/* Compromisso: descrição */}
            {!isAppointment && event.description && (
              <div className="flex items-start gap-3">
                <div className="w-7 flex justify-center shrink-0">
                  <FileText className="size-4 text-muted-foreground mt-0.5" />
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            )}

            {/* Categoria */}
            {event.category && (
              <div className="flex items-center gap-3">
                <div className="w-7 flex justify-center shrink-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: event.category.color }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {event.category.name}
                </span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleDelete}
        isConfirming={isDeleting}
        confirmVariant="destructive"
        confirmLabel="Excluir"
        icon={Trash2}
        title={isAppointment ? "Excluir consulta" : "Excluir compromisso"}
        description={
          isAppointment
            ? "Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita."
            : "Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita."
        }
      />
    </>
  );
}
