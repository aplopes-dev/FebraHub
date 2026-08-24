import type { ReactNode } from 'react';
import { PatientDetailLayout } from '@/features/clinic/modules/patients/layout/patient-detail-layout';

export default function ClinicPacienteDetailLayout({ children }: { children: ReactNode }) {
  return <PatientDetailLayout>{children}</PatientDetailLayout>;
}
