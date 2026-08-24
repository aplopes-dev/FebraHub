/** Cores estáveis por profissional (API não persiste cor). */

const AGENDA_PROFESSIONAL_COLORS = [
  '#7C3AED',
  '#0EA5E9',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
  '#8B5CF6',
  '#F97316',
] as const;

export function colorForProfessionalId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AGENDA_PROFESSIONAL_COLORS[
    hash % AGENDA_PROFESSIONAL_COLORS.length
  ];
}
