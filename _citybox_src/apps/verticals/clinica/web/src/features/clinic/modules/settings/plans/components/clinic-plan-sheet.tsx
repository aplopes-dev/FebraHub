'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NARROW_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { clonePlanSpecialties, clonePlanSpecialtiesForNewPlan } from '../data/plan-specialty-factories';
import { useClinicPlanConfigure } from '../lib/use-clinic-plan-configure';
import { useClinicPlanForm } from '../lib/use-clinic-plan-form';
import type { ClinicPlan } from '../types/clinic-plan';
import type { ClinicPlanSheetSuccessPayload } from '../types/clinic-plan-form';
import type { PlanSpecialtyItem } from '../types/clinic-plan-specialty';
import { findActiveDefaultPlan } from '../lib/find-active-default-plan';
import { PlanConfigureStep } from './plan-configure-step';
import { PlanDefaultConfirmDialog } from './plan-default-confirm-dialog';
import { PlanTreatmentInitField } from './plan-treatment-init-field';

/** Tempo para ignorar dismiss do Sheet após fechar o AlertDialog (click/touch fantasma no mobile). */
const SHEET_DISMISS_GUARD_MS = 400;

type PlanSheetStep = 'initial' | 'configure';

type ClinicPlanSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans?: ClinicPlan[];
  editingPlan?: ClinicPlan | null;
  isSaving?: boolean;
  isLoadingEdit?: boolean;
  onSave?: (payload: ClinicPlanSheetSuccessPayload) => Promise<boolean>;
  onLoadDefaultSpecialties?: () => Promise<PlanSpecialtyItem[]>;
};

export function ClinicPlanSheet({
  open,
  onOpenChange,
  plans = [],
  editingPlan = null,
  isSaving = false,
  isLoadingEdit = false,
  onSave,
  onLoadDefaultSpecialties,
}: ClinicPlanSheetProps) {
  const isEditing = editingPlan !== null;
  const [step, setStep] = useState<PlanSheetStep>('initial');
  const [isContinuing, setIsContinuing] = useState(false);
  const [defaultConfirmOpen, setDefaultConfirmOpen] = useState(false);
  const ignoreSheetDismissUntilRef = useRef(0);

  const activeDefaultPlan = useMemo(
    () => findActiveDefaultPlan(plans, editingPlan?.id),
    [plans, editingPlan?.id],
  );

  const { values, errors, patch, reset, initializeFromPlan, validateInitial, submit } =
    useClinicPlanForm();

  const {
    specialties,
    selectedSpecialtyId,
    selectedSpecialty,
    editingSpecialtyNameId,
    setSelectedSpecialtyId,
    initializeEmpty,
    initializeFromSpecialties,
    resetConfigure,
    addSpecialty,
    updateSpecialty,
    editSpecialty,
    removeSpecialty,
    clearNewlyCreatedSpecialty,
    addTreatment,
    updateTreatment,
    removeTreatment,
  } = useClinicPlanConfigure();

  useEffect(() => {
    if (!open) {
      reset();
      resetConfigure();
      setStep('initial');
      setIsContinuing(false);
      setDefaultConfirmOpen(false);
      return;
    }

    if (editingPlan) {
      initializeFromPlan(editingPlan);
      initializeFromSpecialties(editingPlan.specialties);
      setStep('configure');
      return;
    }

    reset();
    resetConfigure();
    setStep('initial');
  }, [open, editingPlan, initializeFromPlan, initializeFromSpecialties, reset, resetConfigure]);

  const isBusy = isSaving || isContinuing || isLoadingEdit;
  const isConfigureStep = step === 'configure';

  const armSheetDismissGuard = useCallback(() => {
    ignoreSheetDismissUntilRef.current = Date.now() + SHEET_DISMISS_GUARD_MS;
  }, []);

  const shouldIgnoreSheetDismiss = useCallback(() => {
    return defaultConfirmOpen || Date.now() < ignoreSheetDismissUntilRef.current;
  }, [defaultConfirmOpen]);

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && shouldIgnoreSheetDismiss()) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, shouldIgnoreSheetDismiss],
  );

  const handleClose = () => {
    if (isBusy) return;
    onOpenChange(false);
  };

  const handleContinue = async () => {
    if (!validateInitial({ isEditing: false })) return;

    setIsContinuing(true);
    try {
      if (values.treatmentInit === 'copy-default') {
        const defaultSpecialties = (await onLoadDefaultSpecialties?.()) ?? [];
        initializeFromSpecialties(clonePlanSpecialtiesForNewPlan(defaultSpecialties));
      } else {
        initializeEmpty();
      }
      setStep('configure');
    } finally {
      setIsContinuing(false);
    }
  };

  const handleBack = () => {
    if (isBusy) return;
    setStep('initial');
  };

  const handleIsDefaultChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        patch({ isDefault: false });
        return;
      }

      if (activeDefaultPlan) {
        setDefaultConfirmOpen(true);
        return;
      }

      patch({ isDefault: true });
    },
    [activeDefaultPlan, patch],
  );

  const handleDefaultConfirmOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        armSheetDismissGuard();
      }
      setDefaultConfirmOpen(nextOpen);
    },
    [armSheetDismissGuard],
  );

  const handleConfirmDefaultChange = useCallback(() => {
    patch({ isDefault: true });
    armSheetDismissGuard();
    setDefaultConfirmOpen(false);
  }, [armSheetDismissGuard, patch]);

  const handleSave = async () => {
    const isValid = submit({ isEditing, step: 'configure' });
    if (!isValid) return;

    const saved = await onSave?.({
      name: values.name,
      status: values.status,
      isDefault: values.isDefault,
      treatmentInit: values.treatmentInit || undefined,
      specialties: clonePlanSpecialties(specialties),
      planId: editingPlan?.id,
    });

    if (saved) {
      onOpenChange(false);
    }
  };

  const sheetTitle = isEditing
    ? 'Editar plano'
    : isConfigureStep
      ? 'Configurar Plano'
      : 'Novo plano';

  const loadingLabel = isLoadingEdit
    ? 'Carregando plano…'
    : isConfigureStep
      ? 'Salvando plano…'
      : isEditing
        ? 'Salvando plano…'
        : 'Continuando…';

  return (
    <>
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col gap-0 p-0',
          isConfigureStep
            ? cn(CLINIC_FLOATING_SHEET_CONTENT_CLASS, CLINIC_FLOATING_SHEET_LAYOUT_CLASS)
            : CLINIC_NARROW_SHEET_CONTENT_CLASS,
        )}
        onInteractOutside={(event) => {
          if (shouldIgnoreSheetDismiss()) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (shouldIgnoreSheetDismiss()) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle>{sheetTitle}</SheetTitle>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {isBusy ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {loadingLabel}
              </div>
            </div>
          ) : null}

          {isConfigureStep ? (
            <PlanConfigureStep
              values={{ name: values.name, isDefault: values.isDefault }}
              nameError={errors.name}
              disabled={isBusy}
              specialties={specialties}
              selectedSpecialtyId={selectedSpecialtyId}
              selectedSpecialty={selectedSpecialty}
              onPatch={patch}
              onIsDefaultChange={handleIsDefaultChange}
              onSelectSpecialty={setSelectedSpecialtyId}
              onEditSpecialty={editSpecialty}
              onDeleteSpecialty={removeSpecialty}
              onCreateSpecialty={addSpecialty}
              onUpdateSpecialtyName={(specialtyId, name) => updateSpecialty(specialtyId, { name })}
              editingSpecialtyNameId={editingSpecialtyNameId}
              onSpecialtyNameEditComplete={clearNewlyCreatedSpecialty}
              onAddTreatment={() => {
                if (!selectedSpecialtyId) return;
                return addTreatment(selectedSpecialtyId);
              }}
              onUpdateTreatment={updateTreatment}
              onRemoveTreatment={removeTreatment}
            />
          ) : (
            <div className="flex flex-col gap-6 px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="clinic-plan-name">Nome do plano</Label>
                <Input
                  id="clinic-plan-name"
                  value={values.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Ex.: Particular"
                  disabled={isBusy}
                  aria-invalid={!!errors.name}
                />
                {errors.name ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <PlanTreatmentInitField
                value={values.treatmentInit}
                disabled={isBusy}
                error={errors.treatmentInit}
                onChange={(treatmentInit) => patch({ treatmentInit })}
              />
            </div>
          )}
        </div>

        <SheetFooter
          className={cn(
            CLINIC_SHEET_FOOTER_CLASS,
            'flex-col-reverse gap-2 px-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6',
          )}
        >
          <Button
            type="button"
            variant="ghost"
            className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full min-w-0 sm:w-auto')}
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancelar
          </Button>

          {isConfigureStep ? (
            <>
              {!isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full min-w-0 sm:w-auto')}
                  onClick={handleBack}
                  disabled={isBusy}
                >
                  Voltar
                </Button>
              ) : null}
              <Button
                type="button"
                className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full min-w-0 sm:w-auto')}
                onClick={() => void handleSave()}
                disabled={isBusy}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                    Salvando…
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className={cn(CLINIC_SHEET_FOOTER_BUTTON_CLASS, 'w-full min-w-0 sm:w-auto')}
              onClick={() => void handleContinue()}
              disabled={isBusy}
            >
              {isContinuing ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  Continuando…
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>

    <PlanDefaultConfirmDialog
      currentDefaultPlanName={activeDefaultPlan?.name ?? null}
      newPlanName={values.name}
      open={defaultConfirmOpen}
      onOpenChange={handleDefaultConfirmOpenChange}
      onConfirm={handleConfirmDefaultChange}
    />
    </>
  );
}
