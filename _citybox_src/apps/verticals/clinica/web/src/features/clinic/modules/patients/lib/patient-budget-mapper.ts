import type {
  PatientBudgetDiscount,
  PatientBudgetInstallment,
  PatientBudgetPrintSettings,
  PatientBudgetRejectionDraft,
  PatientBudgetSheetSubmitPayload,
  PatientBudgetStatusSelection,
  PatientBudgetTreatmentItem,
} from '../types/patient-budget-form';
import {
  DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS,
  EMPTY_PATIENT_BUDGET_INSTALLMENT,
  EMPTY_PATIENT_BUDGET_REJECTION,
} from '../types/patient-budget-form';
import type { PatientBudget } from '../types/patient-budget';
import { toPatientReturnAlertIsoDate as toIsoDateOnly } from './compute-patient-return-date';

export function createPatientBudgetFromPayload(
  patientId: string,
  payload: PatientBudgetSheetSubmitPayload,
  budgetId: string = crypto.randomUUID(),
): PatientBudget {
  return {
    id: budgetId,
    patientId,
    date: payload.date,
    description: payload.description,
    finalValueCents: payload.finalValueCents,
    status: payload.status,
    responsibleId: payload.responsibleId,
    responsible: payload.responsible,
    treatments: payload.treatments,
    observations: payload.observations,
    discount: payload.discount,
    installment: payload.installmentConfig,
    rejectedAt: payload.rejection?.date ?? null,
    rejectionReason: payload.rejection?.reason ?? null,
  };
}

export function duplicatePatientBudget(budget: PatientBudget): PatientBudget {
  return {
    ...budget,
    id: crypto.randomUUID(),
    date: toIsoDateOnly(new Date()),
    description: `${budget.description} (cópia)`,
    status: 'draft',
    rejectedAt: null,
    rejectionReason: null,
    treatments: budget.treatments.map((treatment) => ({
      ...treatment,
      id: crypto.randomUUID(),
    })),
  };
}

export type PatientBudgetSheetState = {
  formValues: {
    description: string;
    responsibleId: string;
    date: Date | null;
  };
  treatments: PatientBudgetTreatmentItem[];
  observations: string;
  discount: PatientBudgetDiscount | null;
  showDiscount: boolean;
  installment: PatientBudgetInstallment;
  statusSelection: PatientBudgetStatusSelection;
  rejection: PatientBudgetRejectionDraft;
  emitContractOnApprove: boolean;
  printSettings: PatientBudgetPrintSettings;
};

export function getPatientBudgetSheetState(budget: PatientBudget): PatientBudgetSheetState {
  const statusSelection: PatientBudgetStatusSelection =
    budget.status === 'rejected' ? 'rejected' : 'draft';

  return {
    formValues: {
      description: budget.description,
      responsibleId: budget.responsibleId,
      date: new Date(`${budget.date}T12:00:00`),
    },
    treatments: budget.treatments,
    observations: budget.observations,
    discount: budget.discount,
    showDiscount: budget.discount !== null,
    installment: budget.installment,
    statusSelection,
    rejection: {
      date: budget.rejectedAt
        ? new Date(`${budget.rejectedAt}T12:00:00`)
        : new Date(),
      reason: budget.rejectionReason ?? '',
    },
    emitContractOnApprove: false,
    printSettings: { ...DEFAULT_PATIENT_BUDGET_PRINT_SETTINGS },
  };
}

type PatientBudgetSheetSnapshotInput = {
  formValues: PatientBudgetSheetState['formValues'];
  treatments: PatientBudgetTreatmentItem[];
  observations: string;
  discount: PatientBudgetDiscount | null;
  installment: PatientBudgetInstallment;
  statusSelection: PatientBudgetStatusSelection;
  rejection: PatientBudgetRejectionDraft;
  emitContractOnApprove: boolean;
  printSettings: PatientBudgetPrintSettings;
};

export function serializePatientBudgetSheetSnapshot(
  state: PatientBudgetSheetSnapshotInput,
): string {
  return JSON.stringify({
    formValues: {
      description: state.formValues.description.trim(),
      responsibleId: state.formValues.responsibleId,
      date: state.formValues.date ? toIsoDateOnly(state.formValues.date) : null,
    },
    treatments: [...state.treatments]
      .map((treatment) => ({
        id: treatment.id,
        toothNumber: treatment.toothNumber,
        treatmentId: treatment.treatmentId,
        professionalId: treatment.professionalId,
        planId: treatment.planId,
        valueCents: treatment.valueCents,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    observations: state.observations.trim(),
    discount: state.discount,
    installment: state.installment,
    statusSelection: state.statusSelection,
    rejection: {
      date: state.rejection.date ? toIsoDateOnly(state.rejection.date) : null,
      reason: state.rejection.reason.trim(),
    },
    emitContractOnApprove: state.emitContractOnApprove,
    printSettings: state.printSettings,
  });
}

export function isPatientBudgetSheetDirty(
  baselineSnapshot: string,
  current: PatientBudgetSheetSnapshotInput,
): boolean {
  return baselineSnapshot !== serializePatientBudgetSheetSnapshot(current);
}

export function createEmptyPatientBudgetInstallment(): PatientBudgetInstallment {
  return { ...EMPTY_PATIENT_BUDGET_INSTALLMENT };
}

export function createEmptyPatientBudgetRejection(): PatientBudgetRejectionDraft {
  return {
    ...EMPTY_PATIENT_BUDGET_REJECTION,
    date: new Date(),
  };
}
