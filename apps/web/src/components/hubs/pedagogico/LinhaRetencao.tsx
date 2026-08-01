"use client";

import { Pencil } from "lucide-react";
import { desfechoInfo } from "./retencao";
import { C } from "@/lib/tema";
import { dataCurta } from "@/lib/dados";
import type { CasoRetencao } from "@/types/views";

export function LinhaRetencao({ c, onEditar }: { c: CasoRetencao; onEditar: (c: CasoRetencao) => void }) {
  const d = desfechoInfo(c.desfecho);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 20px", borderBottom: `1px solid ${C.hair}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome_cliente}</div>
        <div style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {c.curso}{c.motivo_cancelamento ? ` · ${c.motivo_cancelamento}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 10.5, color: C.faint, width: 52, textAlign: "right" }}>{c.data_ligacao ? dataCurta(c.data_ligacao) : "—"}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, color: d.cor, background: `${d.cor}1A`, border: `1px solid ${d.cor}44`, whiteSpace: "nowrap", width: 78, textAlign: "center" }}>{d.label}</span>
        <button onClick={() => onEditar(c)} aria-label="Editar caso" title="Editar / registrar desfecho"
          style={{ background: "transparent", border: `1px solid ${C.cardLine}`, borderRadius: 8, padding: "5px 6px", cursor: "pointer", color: C.muted, display: "flex" }}>
          <Pencil size={13} />
        </button>
      </div>
    </div>
  );
}
