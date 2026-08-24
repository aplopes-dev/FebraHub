/** Cargos da API com aba “Horários de Atendimento” (e profissionais na agenda). */
export const CLINIC_SERVICE_HOURS_API_ROLES = new Set([
  'aluno',
  'dentista_admin',
  'dentista',
]);

export function showsServiceHoursTabForApiRole(apiRole: string): boolean {
  return CLINIC_SERVICE_HOURS_API_ROLES.has(apiRole);
}
