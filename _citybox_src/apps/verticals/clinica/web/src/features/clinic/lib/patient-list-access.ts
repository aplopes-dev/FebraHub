import type { AppAbility } from '@citybox/clinica-permissions';

/**
 * Entrada na ficha exige `patient_read_personal` (`read` Patient).
 * A listagem usa só `access` Patient (sempre concedido).
 * Demais checkboxes liberam abas/ações dentro da ficha, não a rota.
 */
export function canAccessPatientFicha(ability: AppAbility): boolean {
  return ability.can('read', 'Patient');
}

export function isPatientListPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  const normalized =
    path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  return normalized === '/pacientes';
}

export function isPatientDetailPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return path.startsWith('/pacientes/');
}
