'use client';

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { useTeamMembers } from '@/features/shared/team';
import { useStore } from '@/lib/store-context';
import { storeShowsBodyMap, storeShowsToothMap } from '@/lib/clinic-strand';
import {
  budgetLocationTypeFromUiType,
  defaultLocationUiTypeForClinicStrand,
  locationUiTypeRequiresSelection,
  type ClinicPlanLocationUiType,
} from '@/features/clinic/modules/settings/plans/data/specialty-location-ui-type';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import {
  formatCentsToBrlInput,
  parseBrlCurrencyToCents,
} from '../../../lib/patient-budget-form-utils';
import {
  hofRegionIdsToSelectLabels,
  parsePatientBudgetToothRegionSelectValue,
} from '../../../lib/patient-budget-tooth-numbers';
import { usePatientPlanOptions } from '../../../lib/use-patient-plan-options';
import { usePatientPlanTreatments } from '../../../lib/use-patient-plan-treatments';
import type { PatientStandaloneTreatmentDraft } from '../../../types/patient-treatment';
import { EMPTY_PATIENT_STANDALONE_TREATMENT_DRAFT } from '../../../types/patient-treatment';
import { PatientBudgetBodyRegionSelect } from '../budgets/patient-budget-body-region-select';
import { PatientBudgetToothRegionSelect } from '../budgets/patient-budget-tooth-region-select';
import { PatientBudgetTreatmentSelect } from '../budgets/patient-budget-treatment-select';

const PATIENT_TREATMENT_FIELD_CLASS =
  'w-full border-transparent bg-input/50 hover:bg-input/60';

type PatientTreatmentAddFormProps = {
  patientId: string;
  disabled?: boolean;
  onAddStandalone: (
    draft: PatientStandaloneTreatmentDraft,
    professionalName: string,
    locationUiType?: ClinicPlanLocationUiType,
  ) => void | Promise<void>;
};

export function PatientTreatmentAddForm({
  patientId: _patientId,
  disabled = false,
  onAddStandalone,
}: PatientTreatmentAddFormProps) {
  const { clinicStrand } = useStore();
  const showToothMap = storeShowsToothMap(clinicStrand);
  const showBodyMap = storeShowsBodyMap(clinicStrand);
  const { plans, isLoading: isPlansLoading } = usePatientPlanOptions();
  const { members, isLoading: isMembersLoading } = useTeamMembers();
  const [draft, setDraft] = useState<PatientStandaloneTreatmentDraft>(
    EMPTY_PATIENT_STANDALONE_TREATMENT_DRAFT,
  );
  const [error, setError] = useState<string | undefined>();
  const { treatments: planTreatments, isLoading: isPlanTreatmentsLoading } =
    usePatientPlanTreatments(draft.planId);

  const activeProfessionals = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const selectedPlan = plans.find((plan) => plan.id === draft.planId);
  const selectedTreatment = planTreatments.find((item) => item.id === draft.treatmentId);
  const selectedProfessional = activeProfessionals.find(
    (member) => member.id === draft.professionalId,
  );
  const selectedLocationUiType =
    selectedTreatment?.locationUiType ??
    defaultLocationUiTypeForClinicStrand(clinicStrand);
  const requiresLocationSelection = locationUiTypeRequiresSelection(selectedLocationUiType);
  // Nutrição não trabalha com mapa anatômico: nem o seletor nem o aviso sobre
  // região fazem sentido lá.
  const usesAnatomicLocation = showToothMap || showBodyMap;
  const showToothLocationUi =
    showToothMap &&
    (selectedLocationUiType === 'tooth' || selectedLocationUiType === 'face_region');
  const showBodyLocationUi =
    showBodyMap &&
    (selectedLocationUiType === 'body_region' ||
      (!showToothMap && locationUiTypeRequiresSelection(selectedLocationUiType)));

  const toothRegionSelectValue = useMemo(
    () => [
      ...draft.toothNumbers.map(String),
      ...draft.regionLabels,
      ...hofRegionIdsToSelectLabels(draft.hofRegionIds),
    ],
    [draft.toothNumbers, draft.regionLabels, draft.hofRegionIds],
  );

  const patchDraft = useCallback((partial: Partial<PatientStandaloneTreatmentDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
    setError(undefined);
  }, []);

  const handlePlanChange = useCallback((planId: string) => {
    patchDraft({
      planId,
      treatmentId: '',
      value: '',
      toothNumbers: [],
      regionLabels: [],
      hofRegionIds: [],
    });
  }, [patchDraft]);

  const handleTreatmentChange = useCallback(
    (treatmentId: string) => {
      const treatment = planTreatments.find((item) => item.id === treatmentId);
      patchDraft({
        treatmentId,
        value: treatment ? formatCentsToBrlInput(treatment.valueCents) : '',
        toothNumbers: [],
        regionLabels: [],
        hofRegionIds: [],
      });
    },
    [patchDraft, planTreatments],
  );

  const handleToothRegionSelectChange = useCallback(
    (values: string[]) => {
      const parsed = parsePatientBudgetToothRegionSelectValue(values);
      patchDraft({
        toothNumbers: parsed.toothNumbers,
        regionLabels: parsed.regionLabels,
        hofRegionIds: parsed.hofRegionIds,
      });
    },
    [patchDraft],
  );

  const handleBodyRegionSelectChange = useCallback(
    (regionIds: string[]) => {
      patchDraft({ regionLabels: regionIds });
    },
    [patchDraft],
  );

  const validateDraft = useCallback((): boolean => {
    const hasToothSelection =
      showToothLocationUi &&
      selectedLocationUiType === 'tooth' &&
      (draft.toothNumbers.length > 0 || draft.regionLabels.length > 0);
    const hasHofSelection =
      showToothLocationUi &&
      selectedLocationUiType === 'face_region' &&
      draft.hofRegionIds.length > 0;
    const hasBodySelection = showBodyLocationUi && draft.regionLabels.length > 0;

    if (
      !draft.planId ||
      !draft.treatmentId ||
      !draft.professionalId ||
      (requiresLocationSelection &&
        !hasToothSelection &&
        !hasHofSelection &&
        !hasBodySelection)
    ) {
      setError(
        !requiresLocationSelection
          ? 'Preencha plano, procedimento, valor e profissional.'
          : showBodyLocationUi
            ? 'Preencha plano, procedimento, valor, profissional e ao menos uma região corporal.'
            : selectedLocationUiType === 'face_region'
              ? 'Preencha plano, procedimento, valor, profissional e ao menos uma região facial (HOF).'
              : 'Preencha plano, procedimento, valor, profissional e ao menos um dente/região.',
      );
      return false;
    }

    if (parseBrlCurrencyToCents(draft.value) <= 0) {
      setError('Informe um valor válido para o procedimento.');
      return false;
    }

    if (!selectedPlan || !selectedTreatment || !selectedProfessional) {
      setError('Não foi possível validar os dados do procedimento.');
      return false;
    }

    return true;
  }, [
    draft,
    requiresLocationSelection,
    selectedLocationUiType,
    selectedPlan,
    selectedProfessional,
    selectedTreatment,
    showBodyLocationUi,
    showToothLocationUi,
  ]);

  const handleAddTreatment = useCallback(() => {
    if (!validateDraft() || !selectedPlan || !selectedTreatment || !selectedProfessional) {
      return;
    }

    void Promise.resolve(
      onAddStandalone(draft, selectedProfessional.name, selectedLocationUiType),
    ).then(() => {
      setDraft((current) => ({
        ...current,
        toothNumbers: [],
        regionLabels: [],
        hofRegionIds: [],
      }));
      setError(undefined);
    });
  }, [
    draft,
    onAddStandalone,
    selectedLocationUiType,
    selectedPlan,
    selectedProfessional,
    selectedTreatment,
    validateDraft,
  ]);

  const locationFieldLabel =
    selectedLocationUiType === 'face_region'
      ? 'Região facial'
      : selectedLocationUiType === 'body_region'
        ? 'Região corporal'
        : 'Dente';

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-3 md:p-4">
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-foreground">Adicionar Procedimento</h3>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="patient-treatment-plan">Plano</Label>
              <Select
                value={draft.planId || undefined}
                onValueChange={handlePlanChange}
                disabled={disabled || isPlansLoading || plans.length === 0}
              >
                <SelectTrigger id="patient-treatment-plan" className={PATIENT_TREATMENT_FIELD_CLASS}>
                  <SelectValue
                    placeholder={isPlansLoading ? 'Carregando...' : 'Selecionar plano'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="patient-treatment-treatment">Procedimento</Label>
              <PatientBudgetTreatmentSelect
                id="patient-treatment-treatment"
                value={draft.treatmentId}
                treatments={planTreatments}
                showOptionValue={false}
                disabled={
                  disabled ||
                  !draft.planId ||
                  isPlanTreatmentsLoading ||
                  planTreatments.length === 0
                }
                placeholder={
                  !draft.planId
                    ? 'Selecione um plano'
                    : isPlanTreatmentsLoading
                      ? 'Carregando...'
                      : planTreatments.length === 0
                        ? 'Nenhum procedimento'
                        : 'Selecionar procedimento'
                }
                onValueChange={handleTreatmentChange}
              />
            </div>

            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <Label htmlFor="patient-treatment-value">Valor</Label>
              <PlanBrlCurrencyInput
                id="patient-treatment-value"
                value={draft.value}
                onValueChange={(value) => patchDraft({ value })}
                disabled={disabled}
                className={PATIENT_TREATMENT_FIELD_CLASS}
              />
            </div>

            {showToothLocationUi ? (
              <div className="min-w-0 space-y-1.5">
                <Label>{locationFieldLabel}</Label>
                <PatientBudgetToothRegionSelect
                  value={toothRegionSelectValue}
                  onChange={handleToothRegionSelectChange}
                  disabled={disabled}
                  showHof={selectedLocationUiType === 'face_region'}
                  placeholder="Selecionar Dente/Região"
                  className={PATIENT_TREATMENT_FIELD_CLASS}
                />
              </div>
            ) : null}

            {showBodyLocationUi ? (
              <div className="min-w-0 space-y-1.5">
                <Label>{locationFieldLabel}</Label>
                <PatientBudgetBodyRegionSelect
                  value={draft.regionLabels}
                  onChange={handleBodyRegionSelectChange}
                  disabled={disabled}
                  placeholder="Selecionar região corporal"
                  className={PATIENT_TREATMENT_FIELD_CLASS}
                />
              </div>
            ) : null}

            {usesAnatomicLocation &&
            !requiresLocationSelection &&
            draft.treatmentId &&
            // Fisioterapia: sem aviso para procedimentos `none` (só sessão, se houver).
            (budgetLocationTypeFromUiType(selectedLocationUiType) === 'session' ||
              !showBodyMap) ? (
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {budgetLocationTypeFromUiType(selectedLocationUiType) === 'session'
                    ? 'Este procedimento é registrado por sessão, sem região anatômica.'
                    : 'Este procedimento não exige seleção de região anatômica.'}
                </p>
              </div>
            ) : null}

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="patient-treatment-professional">Profissional</Label>
              <Select
                value={draft.professionalId || undefined}
                onValueChange={(professionalId) => patchDraft({ professionalId })}
                disabled={disabled || isMembersLoading || activeProfessionals.length === 0}
              >
                <SelectTrigger
                  id="patient-treatment-professional"
                  className={cn(
                    PATIENT_TREATMENT_FIELD_CLASS,
                    'h-10 min-h-10 data-[size=default]:h-10',
                  )}
                >
                  <SelectValue
                    placeholder={
                      isMembersLoading ? 'Carregando...' : 'Selecionar profissional'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeProfessionals.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="h-8 whitespace-nowrap"
            disabled={disabled}
            onClick={handleAddTreatment}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            Adicionar procedimento
          </Button>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
