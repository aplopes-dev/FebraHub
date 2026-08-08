import type { CSSProperties } from "react";
import { C, SANS, SOBRE_OURO_2, alfa } from "@/lib/tema";

/* ============ PINTURA DO BOTÃO PRIMÁRIO ============
   O dourado da casa é GRADIENTE, não chapado — é assim no "Adicionar membro"
   do organograma, no BotaoSalvar dos modais e nos cards de Integrações.

   Está aqui porque cinco telas o redeclararam chapado, cada uma por conta
   própria: `background: C.gold`. Chapado ao lado do gradiente lê como botão
   DESABILITADO, e a diferença só aparece quando as duas telas ficam abertas
   lado a lado — que é exatamente quando ninguém está olhando para isso. */
export const PINTURA_OURO: CSSProperties = {
  background: `linear-gradient(90deg, ${C.goldTop}, ${C.goldBase})`,
  color: SOBRE_OURO_2,
  border: "none",
};

/** A mesma pintura, apagada: primário desabilitado ou em andamento. */
export const PINTURA_OURO_OFF: CSSProperties = {
  background: alfa("sup", 0.08),
  color: C.faint,
  border: "none",
};

/* Forma padrão do CTA (pílula). Telas podem sobrescrever só o padding/fonte
   se o contexto pedir — a pintura e o raio ficam iguais em todo o sistema. */
export const BOTAO_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 999,
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  lineHeight: 1.2,
};

/** CTA primário pronto — gradiente dourado + texto escuro. */
export const BOTAO_OURO: CSSProperties = {
  ...BOTAO_BASE,
  ...PINTURA_OURO,
};

/** CTA primário desabilitado / incompleto — mesma família, sem virar “cinza de borda”. */
export const BOTAO_OURO_OFF: CSSProperties = {
  ...BOTAO_BASE,
  ...PINTURA_OURO_OFF,
  cursor: "default",
};

/** Ação secundária (Cancelar, Fechar fluxo). Nunca usar em CTA principal. */
export const BOTAO_SECUNDARIO: CSSProperties = {
  ...BOTAO_BASE,
  background: alfa("sup", 0.05),
  color: C.muted,
  border: `1px solid ${C.cardLine}`,
  fontWeight: 700,
};

/** Escolhe ouro ou ouro apagado conforme o botão está pronto. */
export function botaoOuroOuOff(pronto: boolean): CSSProperties {
  return pronto ? BOTAO_OURO : BOTAO_OURO_OFF;
}

/** Item de lista dentro de um Popover (seletores de ano/mês/produto). */
export const itemPop = (ativo: boolean): CSSProperties => ({
  display: "block", width: "100%", textAlign: "left", padding: "7px 10px",
  borderRadius: 7, border: "none", cursor: "pointer", fontFamily: SANS,
  fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  background: ativo ? alfa("gold", 0.12) : "transparent",
  color: ativo ? C.gold : C.muted,
});

// Estilos de formulário reaproveitados nos modais.
export const inputAv: CSSProperties = {
  width: "100%", background: alfa("sup", 0.04), border: `1px solid ${C.cardLine}`,
  borderRadius: 9, padding: "9px 11px", color: C.text, fontFamily: SANS, fontSize: 13,
};

export const labelAv: CSSProperties = {
  fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase",
  letterSpacing: ".4px", marginBottom: 4, display: "block",
};
