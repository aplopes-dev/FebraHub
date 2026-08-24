import type { FiscalTaxRegime } from "../api/fiscal-settings.dto";

/**
 * Regimes aceitos pela fiscal-api, com o CRT resultante exibido (spec erp/012).
 * Sem CRT 2 (Simples com excesso de sublimite, fora do escopo v1 do builder) nem
 * CRT 4 (MEI, inexistente na fiscal-api) — nenhuma opção pode ser recusada ao salvar.
 */
export const REGIME_OPTIONS: { value: FiscalTaxRegime; label: string }[] = [
  { value: "SIMPLES_NACIONAL", label: "1 — Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "3 — Lucro Presumido" },
  { value: "LUCRO_REAL", label: "3 — Lucro Real" },
];
