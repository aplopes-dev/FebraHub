import { redirect } from 'next/navigation';
import { patientDetailDefaultHref } from '@/features/clinic/modules/patients/lib/patient-detail-tabs';

type ClinicPacienteDetailIndexRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ClinicPacienteDetailIndexRoute({
  params,
}: ClinicPacienteDetailIndexRouteProps) {
  const { id } = await params;
  redirect(patientDetailDefaultHref(id));
}
