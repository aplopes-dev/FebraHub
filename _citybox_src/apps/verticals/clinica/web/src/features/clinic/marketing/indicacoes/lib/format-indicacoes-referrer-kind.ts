import type { IndicacoesReferrerKind } from '../types/indicacoes';

export function formatIndicacoesReferralCountLabel(count: number): string {
  const safe = Math.max(0, Math.trunc(count));
  return safe === 1 ? '1 paciente' : `${safe} pacientes`;
}

export function formatIndicacoesReferrerKindLabel(
  kind: IndicacoesReferrerKind,
): string {
  switch (kind) {
    case 'patient':
      return 'Paciente';
    case 'team':
      return 'Profissional';
    case 'external':
      return 'Profissional externo';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
