/* Helpers de formato do CRM — dinheiro chega em centavos. */

import { reaisCent } from "@/lib/formato";

export const centavos = (v: number | null | undefined): string => reaisCent((v ?? 0) / 100);

export const dataCurta = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") : "—";

export const dataHora = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

/** "R$ 1.234,56" digitado → centavos. Aceita vírgula ou ponto. */
export const paraCentavos = (texto: string): number => {
  const limpo = texto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
