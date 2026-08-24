/**
 * Stub do hook de permissões do OdontoTech (`@/features/auth/hooks/use-can`).
 *
 * A vertical clínica do ERP não usa o sistema de abilities; a feature roda
 * mockada, então toda checagem de permissão é liberada.
 */
export function useCan(_action?: string, _subject?: string): boolean {
  return true;
}
