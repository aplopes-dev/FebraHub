"use client";

import { Pencil } from "lucide-react";
import { C, GROTESK, alfaDe, corStatus } from "@/lib/tema";
import { dataCurta } from "@/lib/dados";
import { fmtPct, moeda, numero } from "@/lib/formato";
import type { Maestro } from "@/types/views";

/* Painel de Maestros: os clientes VIP (compraram MAESTRIA). Lista por maestro
   ordenada por investido; inativo (>12 meses sem comprar) fica destacado em
   âmbar como alerta de acompanhamento. Expõe PII (nome/e-mail) — exceção
   justificada, restrita ao setor pedagógico. */
export function LinhaMaestro({ m, onEditar }: { m: Maestro; onEditar: (m: Maestro) => void }) {
  const cor = corStatus(m.status_maestria);
  const s = String(m.status_maestria ?? "").trim().toLowerCase();
  const acao = s === "vencido" || s === "perto de vencer"; // realça quem pede ação
  const subInfo = [m.empresa, m.email].filter(Boolean).join(" · ") || "—";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "9px 20px", borderBottom: `1px solid ${C.hair}`,
      background: acao ? alfaDe(cor, 0.07) : "transparent",
    }}>
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
        {m.status_maestria && (
          <span title={m.vence_em ? `Maestria vence em ${dataCurta(m.vence_em)}` : m.status_maestria}
            style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".2px", padding: "2px 8px", borderRadius: 999, color: cor, background: alfaDe(cor, 0.1), border: `1px solid ${alfaDe(cor, 0.27)}`, whiteSpace: "nowrap", flexShrink: 0 }}>
            {m.status_maestria}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.email || m.nome || ""}>
            {m.nome}{m.como_gosta_ser_chamado ? <span style={{ color: C.faint, fontWeight: 600 }}> · {m.como_gosta_ser_chamado}</span> : null}
          </div>
          <div style={{ fontSize: 10.5, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subInfo}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span style={{ textAlign: "right", width: 48 }}>
          <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600 }}>{numero(m.total_cursos)}</div>
          <div style={{ fontSize: 9, color: C.dim }}>cursos</div>
        </span>
        <span style={{ textAlign: "right", width: 46 }}>
          <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600 }}>{m.taxa_presenca != null ? fmtPct(m.taxa_presenca) : "—"}</div>
          <div style={{ fontSize: 9, color: C.dim }}>presença</div>
        </span>
        <span style={{ textAlign: "right", width: 54 }}>
          <div style={{ fontSize: 11.5, color: cor, fontWeight: 600 }}>{dataCurta(m.vence_em)}</div>
          <div style={{ fontSize: 9, color: C.dim }}>vence</div>
        </span>
        <span style={{ fontFamily: GROTESK, fontSize: 14, fontWeight: 700, color: C.gold, width: 72, textAlign: "right" }}>{moeda(m.total_investido)}</span>
        <button onClick={() => onEditar(m)} aria-label={`Editar ${m.nome}`} title="Editar anotações"
          style={{ background: "transparent", border: `1px solid ${C.cardLine}`, borderRadius: 8, padding: "5px 6px", cursor: "pointer", color: C.muted, display: "flex", flexShrink: 0 }}>
          <Pencil size={13} />
        </button>
      </div>
    </div>
  );
}
