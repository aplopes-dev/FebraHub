import type { ClinicPatientStatus } from '../types/clinic-patient';

export type PatientStatusToggleMode = 'activate' | 'deactivate';

export function getPatientStatusToggleMode(
  status: ClinicPatientStatus,
): PatientStatusToggleMode {
  return status === 'active' ? 'deactivate' : 'activate';
}

export const PATIENT_STATUS_TOGGLE_COPY: Record<
  PatientStatusToggleMode,
  { title: string; description: (name: string) => string; confirmLabel: string; menuLabel: string }
> = {
  activate: {
    title: 'Ativar paciente?',
    description: (name) =>
      `O paciente ${name} voltará a aparecer como ativo no cadastro e poderá ser usado nas demais áreas.`,
    confirmLabel: 'Ativar',
    menuLabel: 'Ativar',
  },
  deactivate: {
    title: 'Inativar paciente?',
    description: (name) =>
      `O paciente ${name} será marcado como inativo e permanecerá no cadastro.`,
    confirmLabel: 'Inativar',
    menuLabel: 'Inativar',
  },
};
