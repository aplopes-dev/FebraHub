import '@/features/clinic/clinic-sheets.css';
import { ClinicShell } from './_shell';

/**
 * Shell autenticado da clínica. Envolve todas as rotas do backoffice, servidas
 * na raiz (`/`, `/pacientes`, `/agenda`, …). O título vem do `metadata` raiz.
 */
export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell>{children}</ClinicShell>;
}
