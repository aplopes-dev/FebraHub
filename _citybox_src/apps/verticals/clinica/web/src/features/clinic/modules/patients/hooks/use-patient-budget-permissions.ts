'use client';

import { useCan } from '@/features/clinic/permissions';

/** Gates CASL da aba Orçamentos (`patient_budget_*`). */
export function usePatientBudgetPermissions() {
  const canRead = useCan('read', 'PatientBudget');
  const canCreate = useCan('create', 'PatientBudget');
  const canUpdate = useCan('update', 'PatientBudget');
  const canDelete = useCan('delete', 'PatientBudget');
  const canApprove = useCan('approve', 'PatientBudget');

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canApprove,
  };
}
