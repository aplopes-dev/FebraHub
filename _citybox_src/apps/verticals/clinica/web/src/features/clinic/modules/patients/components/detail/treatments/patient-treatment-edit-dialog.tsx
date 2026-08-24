'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input, Label, Textarea } from '@citybox/ui/atoms';
import { ModalForm } from '@citybox/ui/organisms';
import { useStore } from '@/lib/store-context';
import { storeTreatmentDiagnosisPlaceholder } from '@/lib/clinic-strand';
import { formatPatientTreatmentLabel } from '../../../lib/patient-treatment-ui';
import type {
  PatientTreatment,
  PatientTreatmentEditFormValues,
} from '../../../types/patient-treatment';
import { EMPTY_PATIENT_TREATMENT_EDIT_FORM_VALUES } from '../../../types/patient-treatment';

type PatientTreatmentEditDialogProps = {
  treatment: PatientTreatment | null;
  onOpenChange: (open: boolean) => void;
  onSave: (treatmentId: string, values: PatientTreatmentEditFormValues) => void | Promise<void>;
};

export function PatientTreatmentEditDialog({
  treatment,
  onOpenChange,
  onSave,
}: PatientTreatmentEditDialogProps) {
  const { clinicStrand } = useStore();
  const [values, setValues] = useState<PatientTreatmentEditFormValues>(
    EMPTY_PATIENT_TREATMENT_EDIT_FORM_VALUES,
  );
  const [isSaving, setIsSaving] = useState(false);

  const open = treatment !== null;
  const treatmentLabel = treatment ? formatPatientTreatmentLabel(treatment) : '';

  const resetForm = useCallback(() => {
    setValues(EMPTY_PATIENT_TREATMENT_EDIT_FORM_VALUES);
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (!treatment) {
      resetForm();
      return;
    }

    setValues({
      diagnosis: treatment.diagnosis ?? '',
      observation: treatment.observation ?? '',
    });
    setIsSaving(false);
  }, [resetForm, treatment]);

  const patchValues = useCallback((partial: Partial<PatientTreatmentEditFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
  }, []);

  const handleSave = async () => {
    if (!treatment) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(treatment.id, {
        diagnosis: values.diagnosis.trim(),
        observation: values.observation.trim(),
      });
      onOpenChange(false);
    } catch {
      // O chamador exibe o toast de erro.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Editar procedimento"
      subtitle="Atualize o diagnóstico e a observação do procedimento selecionado."
      saveLabel="Salvar"
      isSaving={isSaving}
      onSave={handleSave}
      contentClassName="bg-background p-0 sm:max-w-md"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="patient-treatment-edit-name">Procedimento</Label>
          <Input
            id="patient-treatment-edit-name"
            value={treatmentLabel}
            readOnly
            disabled
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-treatment-edit-diagnosis">Diagnóstico</Label>
          <Textarea
            id="patient-treatment-edit-diagnosis"
            value={values.diagnosis}
            onChange={(event) => patchValues({ diagnosis: event.target.value })}
            placeholder={storeTreatmentDiagnosisPlaceholder(clinicStrand)}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient-treatment-edit-observation">Observação</Label>
          <Textarea
            id="patient-treatment-edit-observation"
            value={values.observation}
            onChange={(event) => patchValues({ observation: event.target.value })}
            placeholder="Observações gerais sobre o procedimento..."
            rows={3}
          />
        </div>
      </div>
    </ModalForm>
  );
}
