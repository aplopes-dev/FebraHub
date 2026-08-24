/**
 * Mapeia o regime tributário da filial (erp-api) para o regime aceito pela
 * fiscal-api (research.md D2).
 *
 * A filial aceita 5 regimes; a fiscal-api aceita só 3. `MEI` e `ISENTO` **não**
 * têm equivalente — retornam `null`, e o provisionamento **bloqueia** com
 * mensagem clara (FR-008). Nunca mapear para um regime arbitrário.
 */

/** Regimes aceitos no cadastro de filial (erp-api). */
export type BranchTaxRegime =
  | "MEI"
  | "SIMPLES_NACIONAL"
  | "LUCRO_PRESUMIDO"
  | "LUCRO_REAL"
  | "ISENTO";

/** Regimes aceitos pela fiscal-api (Emitente). */
export type FiscalTaxRegime =
  | "SIMPLES_NACIONAL"
  | "LUCRO_PRESUMIDO"
  | "LUCRO_REAL";

const REGIME_MAP: Record<BranchTaxRegime, FiscalTaxRegime | null> = {
  SIMPLES_NACIONAL: "SIMPLES_NACIONAL",
  LUCRO_PRESUMIDO: "LUCRO_PRESUMIDO",
  LUCRO_REAL: "LUCRO_REAL",
  MEI: null,
  ISENTO: null,
};

/** Rótulo humano do regime incompatível, para a mensagem de bloqueio. */
export const INCOMPATIBLE_REGIME_LABEL: Record<"MEI" | "ISENTO", string> = {
  MEI: "MEI (Microempreendedor Individual)",
  ISENTO: "Isento",
};

/**
 * Converte o regime da filial para o da fiscal-api, ou `null` quando o regime
 * não é suportado (MEI/ISENTO).
 */
export function mapBranchRegimeToFiscal(
  regime: string | null | undefined,
): FiscalTaxRegime | null {
  if (!regime) return null;
  return REGIME_MAP[regime as BranchTaxRegime] ?? null;
}
