'use client';

import { PatientAboutTab } from '../components/detail/tabs/patient-about-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientAboutPage() {
  const patient = usePatientDetail();
  return <PatientAboutTab patient={patient} />;
}
