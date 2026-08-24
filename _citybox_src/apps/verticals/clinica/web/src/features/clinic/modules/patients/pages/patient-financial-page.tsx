'use client';

import { useCan } from '@/features/clinic/permissions';
import { PatientFinancialTab } from '../components/detail/tabs/patient-financial-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientFinancialPage() {
  const patient = usePatientDetail();
  const canManageDebits = useCan('manage', 'Patient');

  if (!canManageDebits) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sem permissão para acessar débitos do paciente.
      </p>
    );
  }

  return <PatientFinancialTab patientId={patient.id} patientName={patient.name} />;
}
