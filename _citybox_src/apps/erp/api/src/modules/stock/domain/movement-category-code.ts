const CODE_PREFIX = 'CM-';

export function parseMovementCategoryCodeNumber(code: string): number | null {
  const match = /^CM-(\d+)$/i.exec(code.trim());
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/** Formata o próximo código exibido (`CM-001`, `CM-010`, …). */
export function formatMovementCategoryCode(n: number): string {
  return `${CODE_PREFIX}${String(n).padStart(3, '0')}`;
}
