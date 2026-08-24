/**
 * Tratamento central de 403 da clinica-api quando a permissão do membro
 * mudou no meio da sessão (ex.: checkbox removido por outro usuário).
 *
 * Só em **mutations** (POST/PUT/PATCH/DELETE): abre modal → OK recarrega.
 * GET 403 é comum em recursos opcionais (ex.: horários/comissões no sheet)
 * e NÃO deve abrir o modal.
 */

import {
  CLINICA_PERMISSION_DENIED_MESSAGE,
  openPermissionDeniedDialog,
} from './permission-denied-dialog-store';

export { CLINICA_PERMISSION_DENIED_MESSAGE };

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

/**
 * 403 de escopo/pagamento/sessão mantêm a mensagem da API e não abrem o modal.
 * Demais 403 em mutations disparam o fluxo de atualização.
 */
export function shouldPromptPermissionDenied(
  apiMessage: string | undefined,
  method: string = 'GET',
): boolean {
  if (!isMutationMethod(method)) return false;

  const message = (apiMessage ?? '').trim();
  if (!message) return true;

  if (/suspensa|regularize|pagamento/i.test(message)) return false;
  if (/sessão inválida/i.test(message)) return false;

  return true;
}

/** @deprecated use shouldPromptPermissionDenied */
export const shouldReloadOnForbidden = shouldPromptPermissionDenied;

export function resolveForbiddenClientMessage(
  apiMessage: string | undefined,
): string {
  const trimmed = (apiMessage ?? '').trim();
  if (/suspensa|regularize|pagamento/i.test(trimmed)) {
    return trimmed || CLINICA_PERMISSION_DENIED_MESSAGE;
  }
  // Mantém mensagem específica da API (ex.: agenda sem “Fazer atendimentos”).
  if (/não tem permissão|não está habilitado|permissão para/i.test(trimmed)) {
    return trimmed;
  }
  return CLINICA_PERMISSION_DENIED_MESSAGE;
}

/** Abre o modal de permissão negada (substitui toast + reload automático). */
export function promptPermissionDenied(
  message: string = CLINICA_PERMISSION_DENIED_MESSAGE,
): void {
  if (typeof window === 'undefined') return;
  openPermissionDeniedDialog(message);
}
