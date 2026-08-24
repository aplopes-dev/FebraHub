import type { PatientBudgetStatus } from '../types/patient-budget';

export const PATIENT_BUDGET_STATUS_LABEL: Record<PatientBudgetStatus, string> = {
  draft: 'Em aberto',
  approved: 'Aprovado',
  rejected: 'Reprovado',
};

export const PATIENT_BUDGET_STATUS_BADGE_CLASS: Record<PatientBudgetStatus, string> = {
  draft: 'border-border/60 bg-muted/40 text-muted-foreground',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
};

export const PATIENT_BUDGET_STATUS_OPTIONS: PatientBudgetStatus[] = [
  'draft',
  'approved',
  'rejected',
];
