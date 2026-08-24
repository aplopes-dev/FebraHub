import type { StoreVertical } from '../entities/store.entity';

/**
 * Mapeia rótulos de vertical legado → catálogo atual
 * (`Comércio` | `Clínica` | `Imóveis` | `Beautiful`).
 *
 * `Food`/`Varejo` viraram `Comércio` (mesmo ERP). Valores desconhecidos continuam
 * como string — o Zod do domínio rejeita na hidratação, o que é o comportamento
 * desejado para dados inválidos de verdade.
 */
const LEGACY_VERTICAL_MAP: Record<string, StoreVertical> = {
  Food: 'Comércio',
  Varejo: 'Comércio',
  Educação: 'Comércio',
  Serviços: 'Comércio',
  Comércio: 'Comércio',
  Clínica: 'Clínica',
  Imóveis: 'Imóveis',
  Beautiful: 'Beautiful',
};

export function normalizeStoreVertical(
  vertical: string,
): StoreVertical | string {
  return LEGACY_VERTICAL_MAP[vertical] ?? vertical;
}
