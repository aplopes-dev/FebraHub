import type { FiscalTaxRegime } from "@/features/fiscal-settings/api/fiscal-settings.dto";

export type PisCofinsCstOption = {
  value: string;
  label: string;
  /**
   * `true` = tributado **por alíquota %** (01/02) → o formulário mostra o campo
   * de alíquota. `false` = sem campo de alíquota %. ⚠️ CST 03 é tributado, mas
   * **por quantidade** (`qBCProd`/`vAliqProd`), não por %, então fica `false`
   * aqui — o flag gateia o campo de %, não classifica fiscalmente. 03 está
   * indisponível de qualquer forma (`disabledReason`).
   */
  tributado: boolean;
  /** Indisponível nesta versão (fora do conjunto suportado) — mostra o motivo. */
  disabledReason?: string;
};

/**
 * Situações de PIS/COFINS. Suportadas nesta entrega (spec erp/015): 01/02
 * (tributado) e 04–09 (não tributado). As demais aparecem desabilitadas com o
 * motivo, para o usuário entender por que não estão disponíveis.
 */
export const PIS_COFINS_CST_OPTIONS: PisCofinsCstOption[] = [
  { value: "01", label: "01 — Tributável (alíquota básica)", tributado: true },
  {
    value: "02",
    label: "02 — Tributável (alíquota diferenciada)",
    tributado: true,
  },
  {
    value: "03",
    label: "03 — Tributável (por unidade de medida)",
    tributado: false,
    disabledReason: "Exige base por quantidade — fora desta versão.",
  },
  {
    value: "04",
    label: "04 — Monofásica (revenda a alíquota zero)",
    tributado: false,
  },
  { value: "05", label: "05 — Substituição tributária", tributado: false },
  { value: "06", label: "06 — Alíquota zero", tributado: false },
  { value: "07", label: "07 — Isenta da contribuição", tributado: false },
  { value: "08", label: "08 — Sem incidência", tributado: false },
  { value: "09", label: "09 — Com suspensão", tributado: false },
  {
    value: "49",
    label: "49 — Outras operações",
    tributado: false,
    disabledReason: "Configuração de CST 49–99 fora desta versão.",
  },
];

export function isPisCofinsCstTributado(cst: string): boolean {
  return PIS_COFINS_CST_OPTIONS.some(
    (option) => option.value === cst && option.tributado,
  );
}

/**
 * Alíquotas padrão por regime do Emitente (spec erp/015): pré-preenche o formulário
 * com o que o sistema já sabe. Sempre editável. Simples não entra aqui (CST 49
 * automático, não passa pelo cadastro).
 */
export function defaultAliquotasByRegime(
  regime: FiscalTaxRegime | undefined,
): { pis: number; cofins: number } | null {
  switch (regime) {
    case "LUCRO_PRESUMIDO":
      return { pis: 0.65, cofins: 3.0 };
    case "LUCRO_REAL":
      return { pis: 1.65, cofins: 7.6 };
    default:
      return null;
  }
}

/** Faixa do CST (tributado vs não tributado) — para o aviso de divergência PIS×COFINS. */
export function pisCofinsCstFaixa(cst: string): "tributado" | "nao-tributado" {
  return isPisCofinsCstTributado(cst) ? "tributado" : "nao-tributado";
}
