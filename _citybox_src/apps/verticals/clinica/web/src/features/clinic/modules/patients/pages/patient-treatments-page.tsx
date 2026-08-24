'use client';

import { useCan } from '@/features/clinic/permissions';
import { PatientTreatmentsTab } from '../components/detail/tabs/patient-treatments-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientTreatmentsPage() {
  const patient = usePatientDetail();
  const canViewTreatments = useCan('manage', 'PatientTreatment');

  if (!canViewTreatments) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sem permissão para visualizar o prontuário.
      </p>
    );
  }

  return (
    <PatientTreatmentsTab
      patientId={patient.id}
      patientName={patient.name}
      patientPhone={patient.phone}
      patientBirthDate={patient.birthDate}
      patientGender={patient.gender}
    />
  );
}
