'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePicker } from '@citybox/ui/molecules';
import { FindFreeSlotDialog } from '@/features/clinic/agenda/components/find-free-slot-dialog';
import { useTeamMembers } from '@/features/clinic/agenda/api/team';
import { useCategories } from '@/features/clinic/agenda/hooks/use-categories';
import { useCreateAppointment } from '@/features/clinic/agenda/hooks/use-appointments';
import { buildClinicDateTimeIso } from '@/features/clinic/agenda/lib/clinic-datetime';
import type { ReturnOption } from '@/features/clinic/agenda/api/types';
import { patientDetailDefaultHref } from '@/features/clinic/modules/patients/lib/patient-detail-tabs';
import {
  formatPatientPhone,
  maskPatientPhone,
} from '@/features/clinic/modules/patients/lib/format-patient-contact';
import type { CancelledAppointmentTask } from '../types/cancelled-appointment-task';

const RETURN_OPTIONS: Array<{ value: ReturnOption; label: string }> = [
  { value: 'none', label: 'Sem retorno' },
  { value: 'one_month', label: '1 mês' },
  { value: 'six_months', label: '6 meses' },
  { value: 'twelve_months', label: '12 meses' },
  { value: 'custom_date', label: 'Data específica' },
];

type CancelledAppointmentRescheduleDialogProps = {
  task: CancelledAppointmentTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: (taskId: string) => void;
};

export function CancelledAppointmentRescheduleDialog({
  task,
  open,
  onOpenChange,
  onRescheduled,
}: CancelledAppointmentRescheduleDialogProps) {
  const createAppointment = useCreateAppointment();
  const { data: teamData } = useTeamMembers({ status: 'active' });
  const { data: categories = [] } = useCategories();

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [phoneEditable, setPhoneEditable] = useState(false);
  const [professionalId, setProfessionalId] = useState('');
  const [durationMin, setDurationMin] = useState(30);
  const [date, setDate] = useState<string | undefined>();
  const [startTime, setStartTime] = useState<string | undefined>();
  const [observations, setObservations] = useState('');
  const [returnOption, setReturnOption] = useState<ReturnOption>('none');
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [categoryId, setCategoryId] = useState<string>('');
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setPatientName(task.patientName);
    setPatientPhone(formatPatientPhone(task.patientPhone));
    setPhoneEditable(false);
    setProfessionalId(task.professionalId);
    setDurationMin(task.durationMin);
    setDate(undefined);
    setStartTime(undefined);
    setObservations(task.observations ?? '');
    setReturnOption('none');
    setReturnDate(undefined);
    setSendConfirmation(true);
    setCategoryId(task.categoryId ?? '');
  }, [open, task]);

  const professionals = teamData?.professionals ?? [];

  const handleSlotSelect = (slotDate: Date, time: string) => {
    setDate(format(slotDate, 'yyyy-MM-dd'));
    setStartTime(time.slice(0, 5));
    setSlotDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!task) return;
    if (!professionalId) {
      toast.error('Selecione o profissional');
      return;
    }
    if (!date || !startTime) {
      toast.error('Defina a data e o horário da consulta');
      return;
    }
    if (durationMin < 5) {
      toast.error('Duração inválida');
      return;
    }

    createAppointment.mutate(
      {
        patientId: task.patientId,
        professionalId,
        categoryId: categoryId || null,
        date: buildClinicDateTimeIso(date, startTime),
        durationMin,
        observations: observations.trim() || null,
        returnOption,
        returnDate:
          returnOption === 'custom_date' && returnDate
            ? format(returnDate, 'yyyy-MM-dd')
            : null,
        returnReason: null,
      },
      {
        onSuccess: () => {
          toast.success('Consulta reagendada com sucesso');
          onRescheduled(task.id);
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Não foi possível reagendar a consulta');
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4">
            <DialogTitle>Reagendar consulta</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reschedule-patient-name">Paciente</Label>
                <Input
                  id="reschedule-patient-name"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  readOnly
                  className="bg-muted/40"
                />
                {task ? (
                  <Link
                    href={patientDetailDefaultHref(task.patientId)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Abrir ficha do paciente
                  </Link>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reschedule-patient-phone">Celular</Label>
                <Input
                  id="reschedule-patient-phone"
                  value={patientPhone}
                  onChange={(event) =>
                    setPatientPhone(maskPatientPhone(event.target.value))
                  }
                  inputMode="tel"
                  readOnly={!phoneEditable}
                  className={!phoneEditable ? 'bg-muted/40' : undefined}
                />
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setPhoneEditable(true)}
                >
                  Alterar número
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <Select value={professionalId} onValueChange={setProfessionalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.name}
                    </SelectItem>
                  ))}
                  {task &&
                  !professionals.some((item) => item.id === task.professionalId) ? (
                    <SelectItem value={task.professionalId}>
                      {task.professionalName}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[auto_1fr]">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!professionalId}
                onClick={() => setSlotDialogOpen(true)}
              >
                <Clock className="size-4" aria-hidden />
                Encontrar horário livre
              </Button>
              <div className="space-y-1.5">
                <Label htmlFor="reschedule-duration">Duração (min)</Label>
                <Input
                  id="reschedule-duration"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={durationMin}
                  onChange={(event) =>
                    setDurationMin(Number(event.target.value) || 30)
                  }
                />
              </div>
            </div>

            {date && startTime ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input value={date} readOnly className="bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label>Horário</Label>
                  <Input value={startTime} readOnly className="bg-muted/40" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Use &quot;Encontrar horário livre&quot; para definir data e horário.
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reschedule-observations">Observação</Label>
              <Textarea
                id="reschedule-observations"
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Retornar em</Label>
              <Select
                value={returnOption}
                onValueChange={(value) => setReturnOption(value as ReturnOption)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {returnOption === 'custom_date' ? (
              <div className="space-y-1.5">
                <Label>Data do retorno</Label>
                <DatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  className="w-full"
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-3 py-2.5">
              <Label htmlFor="reschedule-send-confirmation" className="text-sm font-normal">
                Enviar confirmação e lembrete de consulta automático
              </Label>
              <Switch
                id="reschedule-send-confirmation"
                checked={sendConfirmation}
                onCheckedChange={setSendConfirmation}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full space-y-1.5 sm:max-w-[14rem]">
              <Label>Categoria</Label>
              <Select
                value={categoryId || '__none__'}
                onValueChange={(value) =>
                  setCategoryId(value === '__none__' ? '' : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
              <Button
                type="button"
                className="flex-1 sm:flex-none"
                disabled={createAppointment.isPending}
                onClick={handleSubmit}
              >
                Reagendar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FindFreeSlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        durationMinutes={durationMin}
        professionalId={professionalId || undefined}
        onSelectSlot={handleSlotSelect}
      />
    </>
  );
}
