"use client";

import { C } from "@/lib/tema";
import { numero } from "@/lib/formato";
import type { PedagogicoRetencaoMotivo } from "@/types/views";

// Motivos mais frequentes: barra 100% (retidos verde / cancelados vermelho).
export function ListaMotivos({ linhas }: { linhas: readonly PedagogicoRetencaoMotivo[] }) {
  return (
    <div>
      {linhas.map((m, i) => {
        const r = Number(m.retidos ?? 0), c = Number(m.cancelados ?? 0), t = r + c || 1;
        return (
          <div key={i} style={{ padding: "8px 20px", borderBottom: `1px solid ${C.hair}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.motivo ?? ""}>{m.motivo || "—"}</span>
              <span style={{ fontSize: 10.5, color: C.faint, flexShrink: 0 }}><b style={{ color: C.up }}>{numero(r)}</b> retidos · <b style={{ color: C.down }}>{numero(c)}</b> cancel.</span>
            </div>
            <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,.06)" }}>
              <div style={{ width: `${(r / t) * 100}%`, background: C.up }} />
              <div style={{ width: `${(c / t) * 100}%`, background: C.down }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
