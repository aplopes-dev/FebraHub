import {
  parseBrlCurrencyToCents,
  parsePositiveInteger,
} from './patient-budget-form-utils';
import type { PatientBudgetInstallment } from '../types/patient-budget-form';

/** Quantidade de receitas que a aprovação deve gerar (resumo do modal). */
export function countBudgetApproveRevenues(input: {
  treatmentsCount: number;
  installment: PatientBudgetInstallment;
}): number {
  if (!input.installment.enabled) {
    return Math.max(input.treatmentsCount, 0);
  }

  const installmentsCount = parsePositiveInteger(input.installment.installmentsCount);
  const hasDownPayment = parseBrlCurrencyToCents(input.installment.downPayment) > 0;
  return (hasDownPayment ? 1 : 0) + installmentsCount;
}
