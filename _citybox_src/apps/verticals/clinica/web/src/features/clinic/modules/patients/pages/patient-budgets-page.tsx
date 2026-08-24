'use client';

import { PatientBudgetsTab } from '../components/detail/tabs/patient-budgets-tab';
import { usePatientBudgetPermissions } from '../hooks/use-patient-budget-permissions';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientBudgetsPage() {
  const patient = usePatientDetail();
  const { canRead } = usePatientBudgetPermissions();

  if (!canRead) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sem permissão para visualizar orçamentos.
      </p>
    );
  }

  return <PatientBudgetsTab patientId={patient.id} patientName={patient.name} />;
}
