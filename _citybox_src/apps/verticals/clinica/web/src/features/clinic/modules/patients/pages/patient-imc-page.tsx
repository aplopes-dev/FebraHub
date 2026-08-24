'use client';

import { PatientImcTab } from '../components/detail/tabs/patient-imc-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientImcPage() {
  const patient = usePatientDetail();
  return <PatientImcTab patient={patient} />;
}
