'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@citybox/ui/atoms';
import type { PatientBudget } from '../../../types/patient-budget';
import {
  calculatePatientBudgetDiscountCents,
  sumPatientBudgetTreatmentCents,
} from '../../../lib/patient-budget-form-utils';
import { PATIENT_MODAL_FULL_BLEED_SEPARATOR_CLASS } from '../../../lib/patient-detail-tabs-ui';
import { PatientBudgetTreatmentsTable } from './patient-budget-treatments-table';

type PatientBudgetTreatmentsDialogProps = {
  budget: PatientBudget | null;
  onOpenChange: (open: boolean) => void;
};

export function PatientBudgetTreatmentsDialog({
  budget,
  onOpenChange,
}: PatientBudgetTreatmentsDialogProps) {
  const subtotalCents = budget
    ? sumPatientBudgetTreatmentCents(budget.treatments)
    : 0;
  const discountCents = budget
    ? calculatePatientBudgetDiscountCents(subtotalCents, budget.discount)
    : 0;
  const totalCents = budget?.finalValueCents ?? 0;

  return (
    <Dialog open={budget !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-full max-w-5xl flex-col gap-0 overflow-y-auto p-0 pt-6 pb-6 sm:max-w-5xl">
        <DialogHeader className="min-w-0 shrink-0 space-y-0 px-6 pb-4">
          <DialogTitle>Lista de procedimentos</DialogTitle>
          <DialogDescription className="sr-only">
            Procedimentos incluídos no orçamento selecionado.
          </DialogDescription>
        </DialogHeader>

        <Separator className={PATIENT_MODAL_FULL_BLEED_SEPARATOR_CLASS} />

        {budget ? (
          <div className="px-6 pt-4">
            <PatientBudgetTreatmentsTable
              treatments={budget.treatments}
              readOnly
              embedded
              totals={{
                subtotalCents,
                discountCents,
                totalCents,
              }}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
