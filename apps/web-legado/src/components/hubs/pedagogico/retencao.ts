import { C } from "@/lib/tema";

/* ============ RETENÇÃO (entrada manual) ============ */
// Desfecho da ligação de retenção: pendente (aguarda), retido (sucesso),
// cancelado. Os valores gravados são minúsculos — mesma string que as views
// vw_pedagogico_retencao(_motivos) contam.
export interface Desfecho {
  key: string;
  label: string;
  cor: string;
}

export const DESFECHOS: readonly Desfecho[] = [
  { key: "pendente", label: "Pendente", cor: C.warn },
  { key: "retido", label: "Retido", cor: C.up },
  { key: "cancelado", label: "Cancelado", cor: C.down },
];

export const desfechoInfo = (d: unknown): Desfecho =>
  DESFECHOS.find((x) => x.key === String(d ?? "").trim().toLowerCase())
  ?? { key: "", label: String(d ?? "") || "—", cor: C.muted };
