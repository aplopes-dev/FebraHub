'use client';

import { useCan } from '@/features/clinic/permissions';
import { PatientAnamnesisTab } from '../components/detail/tabs/patient-anamnesis-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientAnamnesisPage() {
  const patient = usePatientDetail();
  const canManageAnamnesis = useCan('manage', 'PatientAnamnesis');

  if (!canManageAnamnesis) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sem permissão para acessar anamneses do paciente.
      </p>
    );
  }

  return (
    <PatientAnamnesisTab
      patientId={patient.id}
      patientName={patient.name}
      patientEmail={patient.email}
      patientPhone={patient.phone}
      patientBirthDate={patient.birthDate}
      patientGender={patient.gender}
      patientAddress={patient.address}
    />
  );
}
