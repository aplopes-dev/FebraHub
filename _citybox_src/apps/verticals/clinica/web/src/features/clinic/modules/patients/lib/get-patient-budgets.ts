import { MOCK_PATIENT_BUDGETS } from '../data/mock-patient-budgets';
import type { PatientBudget } from '../types/patient-budget';

export function getPatientBudgets(patientId: string): PatientBudget[] {
  return MOCK_PATIENT_BUDGETS.filter((budget) => budget.patientId === patientId);
}
