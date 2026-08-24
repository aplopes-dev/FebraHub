/**
 * Multiplica duas quantidades Decimal-string com precisão fixa (6 casas —
 * mesma escala de `Decimal(18,6)` no schema) e devolve string "limpa", sem
 * zeros à direita. Usado para o insumo × quantidade produzida, sem puxar uma
 * lib de decimal só para isso (mesmo estilo de `Number(...)` já usado nas
 * entidades do módulo).
 */
export function multiplyDecimal(a: string, b: string): string {
  const result = Number(a) * Number(b);
  if (!Number.isFinite(result)) return '0';
  const fixed = result.toFixed(6);
  const trimmed = fixed.includes('.')
    ? fixed.replace(/0+$/, '').replace(/\.$/, '')
    : fixed;
  return trimmed === '' ? '0' : trimmed;
}
