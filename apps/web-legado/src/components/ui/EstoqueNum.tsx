"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { C, GROTESK, alfa } from "@/lib/tema";

/* Número de estoque. `alerta` pinta em vermelho. `compacto` é a faixa
   horizontal do card de estoque: ícone + "Rótulo · Valor · detalhe" numa
   linha que QUEBRA (sem corte) — o valor destacado no meio. */
export function EstoqueNum({
  Icone, label, valor, sub, alerta, compacto,
}: {
  Icone: LucideIcon;
  label: ReactNode;
  valor: ReactNode;
  sub?: ReactNode;
  alerta?: boolean;
  compacto?: boolean;
}) {
  const cor = alerta ? C.down : C.gold;
  if (compacto) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 11,
        background: alfa("sup", 0.03),
        border: `1px solid ${alerta ? alfa("down", 0.27) : C.cardLine}`, borderRadius: 11, padding: "10px 13px",
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: alerta ? alfa("down", 0.12) : alfa("gold", 0.09), color: cor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icone size={15} />
        </span>
        <div style={{ minWidth: 0, flex: 1, fontSize: 12, lineHeight: 1.4, color: C.faint }}>
          <b style={{ color: C.muted, fontWeight: 700 }}>{label}</b>
          <span style={{ color: C.dim }}> · </span>
          <b style={{ fontFamily: GROTESK, fontSize: 15.5, fontWeight: 700, letterSpacing: "-.3px", color: cor }}>{valor}</b>
          {sub && <><span style={{ color: C.dim }}> · </span>{sub}</>}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      flex: 1, minWidth: 150, background: alfa("sup", 0.03),
      border: `1px solid ${alerta ? alfa("down", 0.27) : C.cardLine}`, borderRadius: 13, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: alerta ? alfa("down", 0.12) : alfa("gold", 0.09), color: cor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icone size={15} />
        </span>
        <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontFamily: GROTESK, fontSize: 30, fontWeight: 700, letterSpacing: "-1px", color: cor, lineHeight: 1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: alerta ? C.down : C.faint, marginTop: 6, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}
