import { SeriesInvalidFormatError } from './errors/series-invalid-format.error';

/// Formato de série (spec erp/011, D4).
///
/// ⚠️ A **emissão persiste a série sem zeros à esquerda** (`series = '1'` em
/// `issue-nfe.use-case.ts`). Para a tela editar/gerir a MESMA sequência que a
/// emissão consome, a série é **canonicalizada** removendo zeros à esquerda.
/// Assim "001", "01" e "1" referem-se à mesma sequência. A exibição volta a
/// preencher com zeros para casar com a referência visual ("001").

/// Aceita 1–3 dígitos numéricos; devolve a forma canônica (sem zeros à
/// esquerda). Lança `SeriesInvalidFormatError` para entrada inválida.
export function canonicalizeSeries(context: string, raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!/^[0-9]{1,3}$/.test(trimmed)) {
    throw new SeriesInvalidFormatError(context, raw);
  }
  // Remove zeros à esquerda mantendo ao menos um dígito ("000" → "0"). O regex
  // acima já garante ≤ 3 dígitos, então a forma canônica nunca excede o limite.
  return String(Number.parseInt(trimmed, 10));
}

/// Exibição com zeros à esquerda (3 posições), como na referência ("001").
export function displaySeries(canonical: string): string {
  return canonical.padStart(3, '0');
}
