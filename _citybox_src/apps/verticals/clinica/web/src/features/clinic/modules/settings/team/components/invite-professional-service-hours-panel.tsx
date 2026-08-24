'use client';

import { Clock } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Checkbox, Input, Label, Switch } from '@citybox/ui/atoms';
import { WEEKDAY_LABELS } from '../data/mock-service-hours';
import { WEEKDAY_IDS } from '../types/service-hours';
import type { FixedLunchBreakPatch } from '../types/service-hours';
import type { ServiceHoursConfig } from '../types/service-hours';
import type { WeekdayId } from '../types/service-hours';
import type { WeekdaySchedulePatch } from '../types/service-hours';

type InviteProfessionalServiceHoursPanelProps = {
  serviceHours: ServiceHoursConfig;
  disabled?: boolean;
  onUpdateWeekday: (weekdayId: WeekdayId, patch: WeekdaySchedulePatch) => void;
  onUpdateConsultationMinutes: (minutes: number) => void;
  onUpdateFixedLunchBreak: (patch: FixedLunchBreakPatch) => void;
};

function TimeField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="time"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn('w-full pr-9', disabled && 'opacity-50')}
        />
        <Clock
          className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function InviteProfessionalServiceHoursPanel({
  serviceHours,
  disabled = false,
  onUpdateWeekday,
  onUpdateConsultationMinutes,
  onUpdateFixedLunchBreak,
}: InviteProfessionalServiceHoursPanelProps) {
  const lunchBreakEnabled = serviceHours.fixedLunchBreak.enabled;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure os horários de atendimento do profissional.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {WEEKDAY_IDS.map((weekdayId) => {
            const schedule = serviceHours.weekSchedule[weekdayId];
            const dayDisabled = disabled || !schedule.enabled;
            const checkboxId = `invite-service-hours-${weekdayId}`;

            return (
              <div
                key={weekdayId}
                className="space-y-3 rounded-lg border border-border/60 p-3 xl:rounded-none xl:border-0 xl:p-0"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={schedule.enabled}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onUpdateWeekday(weekdayId, { enabled: checked === true })
                    }
                  />
                  <Label htmlFor={checkboxId} className="text-sm font-medium">
                    {WEEKDAY_LABELS[weekdayId]}
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                  <TimeField
                    id={`${checkboxId}-start`}
                    label="Horário inicial"
                    value={schedule.startTime}
                    disabled={dayDisabled}
                    onChange={(startTime) => onUpdateWeekday(weekdayId, { startTime })}
                  />

                  <TimeField
                    id={`${checkboxId}-end`}
                    label="Horário final"
                    value={schedule.endTime}
                    disabled={dayDisabled}
                    onChange={(endTime) => onUpdateWeekday(weekdayId, { endTime })}
                  />
                </div>
              </div>
            );
          })}
        </div>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="invite-service-hours-consultation-minutes">
          Tempo padrão para consulta (minutos)
        </Label>
        <Input
          id="invite-service-hours-consultation-minutes"
          type="number"
          min={5}
          max={240}
          step={5}
          value={serviceHours.defaultConsultationMinutes}
          disabled={disabled}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(parsed)) {
              onUpdateConsultationMinutes(parsed);
            }
          }}
          className="w-24"
        />
      </div>

      <div className="space-y-4 border-t border-border/60 pt-4">
        <div className="flex items-center gap-3">
          <Switch
            id="invite-service-hours-lunch-break"
            checked={lunchBreakEnabled}
            disabled={disabled}
            onCheckedChange={(checked) => onUpdateFixedLunchBreak({ enabled: checked === true })}
          />
          <Label htmlFor="invite-service-hours-lunch-break" className="text-sm font-normal">
            Horário de almoço fixo
          </Label>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-4">
          <TimeField
            id="invite-service-hours-lunch-start"
            label="Início"
            value={serviceHours.fixedLunchBreak.startTime}
            disabled={disabled || !lunchBreakEnabled}
            onChange={(startTime) => onUpdateFixedLunchBreak({ startTime })}
          />
          <TimeField
            id="invite-service-hours-lunch-end"
            label="Fim"
            value={serviceHours.fixedLunchBreak.endTime}
            disabled={disabled || !lunchBreakEnabled}
            onChange={(endTime) => onUpdateFixedLunchBreak({ endTime })}
          />
        </div>
      </div>
    </div>
  );
}
