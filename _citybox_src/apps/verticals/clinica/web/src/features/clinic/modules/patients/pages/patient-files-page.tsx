'use client';

import { useCan } from '@/features/clinic/permissions';
import { PatientFilesTab } from '../components/detail/tabs/patient-files-tab';
import { usePatientDetail } from '../lib/patient-detail-context';

export function PatientFilesPage() {
  const patient = usePatientDetail();
  const canCreateFiles = useCan('create', 'PatientFile');
  const canUpdateFiles = useCan('update', 'PatientFile');
  const canDeleteFiles = useCan('delete', 'PatientFile');
  const canAccessFiles = canCreateFiles || canUpdateFiles || canDeleteFiles;

  if (!canAccessFiles) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Sem permissão para acessar arquivos do paciente.
      </p>
    );
  }

  return <PatientFilesTab patientId={patient.id} />;
}
