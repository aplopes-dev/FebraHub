'use client';

import { usePatientDetail } from '../lib/patient-detail-context';
import { PatientDocumentsTab } from '../components/detail/documents/patient-documents-tab';

export function PatientDocumentsPage() {
  const patient = usePatientDetail();

  return (
    <PatientDocumentsTab
      patientId={patient.id}
      patientName={patient.name}
      patientCpf={patient.cpf}
      patientAddress={patient.address}
    />
  );
}
