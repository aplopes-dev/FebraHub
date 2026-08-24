'use client';

import { Input, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import type { ClinicPlanFormData } from '../types/clinic-plan-form';
import type { PlanSpecialtyItem, PlanTreatmentItem } from '../types/clinic-plan-specialty';
import { PlanSpecialtiesSidebar } from './plan-specialties-sidebar';
import { PlanTreatmentsPanel } from './plan-treatments-panel';

type TreatmentPatch = Partial<
  Pick<PlanTreatmentItem, 'name' | 'treatmentValue' | 'treatmentCost' | 'enabled' | 'acceptsFaces'>
>;

type PlanConfigureStepProps = {
  values: Pick<ClinicPlanFormData, 'name' | 'isDefault'>;
  nameError?: string;
  disabled?: boolean;
  specialties: PlanSpecialtyItem[];
  selectedSpecialtyId: string | null;
  selectedSpecialty: PlanSpecialtyItem | null;
  onPatch: (patch: Partial<Pick<ClinicPlanFormData, 'name' | 'isDefault'>>) => void;
  onIsDefaultChange?: (checked: boolean) => void;
  onSelectSpecialty: (specialtyId: string) => void;
  onEditSpecialty: (specialtyId: string) => void;
  onDeleteSpecialty: (specialtyId: string) => void;
  onCreateSpecialty: () => string;
  onUpdateSpecialtyName: (specialtyId: string, name: string) => void;
  editingSpecialtyNameId: string | null;
  onSpecialtyNameEditComplete: () => void;
  onAddTreatment: () => string | void;
  onUpdateTreatment: (specialtyId: string, treatmentId: string, patch: TreatmentPatch) => void;
  onRemoveTreatment: (specialtyId: string, treatmentId: string) => void;
};

export function PlanConfigureStep({
  values,
  nameError,
  disabled = false,
  specialties,
  selectedSpecialtyId,
  selectedSpecialty,
  onPatch,
  onIsDefaultChange,
  onSelectSpecialty,
  onEditSpecialty,
  onDeleteSpecialty,
  onCreateSpecialty,
  onUpdateSpecialtyName,
  editingSpecialtyNameId,
  onSpecialtyNameEditComplete,
  onAddTreatment,
  onUpdateTreatment,
  onRemoveTreatment,
}: PlanConfigureStepProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end gap-4 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0 flex-1 basis-full space-y-1.5 sm:min-w-[12rem] sm:basis-auto">
          <Label htmlFor="clinic-plan-configure-name">Nome do plano</Label>
          <Input
            id="clinic-plan-configure-name"
            value={values.name}
            disabled={disabled}
            placeholder="Nome do plano"
            aria-invalid={!!nameError}
            onChange={(event) => onPatch({ name: event.target.value })}
          />
          {nameError ? (
            <p className="text-sm text-destructive" role="alert">
              {nameError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 pb-0.5">
          <ClinicCompactSwitch
            id="clinic-plan-is-default"
            checked={values.isDefault}
            disabled={disabled}
            onCheckedChange={(checked) => {
              if (onIsDefaultChange) {
                onIsDefaultChange(checked === true);
                return;
              }
              onPatch({ isDefault: checked === true });
            }}
          />
          <Label htmlFor="clinic-plan-is-default" className="text-sm font-normal">
            Plano padrão
          </Label>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
        <PlanSpecialtiesSidebar
          specialties={specialties}
          selectedSpecialtyId={selectedSpecialtyId}
          editingSpecialtyNameId={editingSpecialtyNameId}
          disabled={disabled}
          onSelectSpecialty={onSelectSpecialty}
          onEditSpecialty={onEditSpecialty}
          onDeleteSpecialty={onDeleteSpecialty}
          onUpdateSpecialtyName={onUpdateSpecialtyName}
          onSpecialtyNameEditComplete={onSpecialtyNameEditComplete}
          onCreateSpecialty={onCreateSpecialty}
        />

        <PlanTreatmentsPanel
          specialty={selectedSpecialty}
          disabled={disabled}
          onAddTreatment={onAddTreatment}
          onUpdateTreatment={(treatmentId, patch) => {
            if (!selectedSpecialty) return;
            onUpdateTreatment(selectedSpecialty.id, treatmentId, patch);
          }}
          onRemoveTreatment={(treatmentId) => {
            if (!selectedSpecialty) return;
            onRemoveTreatment(selectedSpecialty.id, treatmentId);
          }}
        />
      </div>
    </div>
  );
}
