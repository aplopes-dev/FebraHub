import { MOCK_CLINIC_PATIENTS } from '../data/mock-patients';
import type { ClinicPatient } from '../types/clinic-patient';

export function getPatientById(patientId: string): ClinicPatient | null {
  return MOCK_CLINIC_PATIENTS.find((patient) => patient.id === patientId) ?? null;
}
