'use client';

import { RichTextEditor } from '@citybox/ui/organisms';
import { NUTRITION_TREATMENT_PLAN_FIELDS } from '../../../lib/nutrition-treatment-plan-fields';
import type { PatientNutritionTreatmentPlan } from '../../../types/patient-nutrition-treatment-plan';

const EDITOR_CLASS = 'min-h-[14rem]';

type PatientNutritionTreatmentPlanFormProps = {
  value: PatientNutritionTreatmentPlan;
  disabled?: boolean;
  onChange: (next: PatientNutritionTreatmentPlan) => void;
};

export function PatientNutritionTreatmentPlanForm({
  value,
  disabled = false,
  onChange,
}: PatientNutritionTreatmentPlanFormProps) {
  return (
    <div className="space-y-10">
      {NUTRITION_TREATMENT_PLAN_FIELDS.map((field) => (
        <section key={field.id} className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            {field.label}
          </h3>
          <RichTextEditor
            value={value[field.id]}
            onChange={(html) => onChange({ ...value, [field.id]: html })}
            ariaLabel={field.label}
            placeholder={field.placeholder}
            toolbar="basic"
            disabled={disabled}
            className={EDITOR_CLASS}
          />
        </section>
      ))}
    </div>
  );
}
