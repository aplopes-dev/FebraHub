"use client";

import type { CSSProperties } from "react";
import { Check, Link2 } from "lucide-react";
import { corPendencia } from "./FaixaPendencias";
import { C, GROTESK, SANS, alfa, alfaDe } from "@/lib/tema";
import { dataDDMM, emNDias } from "@/lib/dados";
import { numero } from "@/lib/formato";
import type { TurmaPainel } from "@/types/views";

const corDias = (n: number | null | undefined): string => {
  if (n == null) return C.faint;
  const v = Number(n);
  return v <= 10 ? C.down : v <= 20 ? C.gold : C.faint;
};

// Tabela das turmas do painel. Clique na linha (ou em "colar link") abre o
// drawer da turma (bloco 2).
export function TabelaConfirmacoes({
  turmas, onAbrir,
}: {
  turmas: readonly TurmaPainel[];
  onAbrir: (t: TurmaPainel) => void;
}) {
  const th = (txt: string, alin: CSSProperties["textAlign"]) => (
    <th style={{ textAlign: alin, padding: "8px 12px", fontSize: 9.5, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.dim, whiteSpace: "nowrap" }}>{txt}</th>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
            {th("Turma", "left")}{th("Início", "left")}{th("Matr.", "right")}{th("Enviadas", "right")}{th("Confirmaram", "right")}{th("Grupo", "left")}{th("Pendência", "left")}
          </tr>
        </thead>
        <tbody>
          {turmas.map((t) => {
            const cd = corDias(t.dias_para_inicio);
            return (
              <tr key={t.turma_id} onClick={() => onAbrir(t)} style={{ borderBottom: `1px solid ${C.hair}`, cursor: "pointer" }}>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }} title={t.curso ?? ""}>{t.curso}</div>
                </td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{dataDDMM(t.data_inicio)}</span>
                  <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 999, color: cd, background: alfaDe(cd, 0.1), border: `1px solid ${alfaDe(cd, 0.27)}` }}>{emNDias(t.dias_para_inicio)}</span>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: GROTESK, fontSize: 12.5, color: C.text }}>{numero(t.matriculados)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: GROTESK, fontSize: 12.5, color: C.text }}>{numero(t.confirmacao_enviada)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: GROTESK, fontSize: 12.5, color: C.up }}>{numero(t.confirmaram)}</td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  {t.grupo_criado
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.up, fontWeight: 700 }}><Check size={13} /> criado</span>
                    : <span onClick={(e) => { e.stopPropagation(); onAbrir(t); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: C.gold, cursor: "pointer", padding: "3px 9px", borderRadius: 8, border: `1px solid ${alfa("gold", 0.33)}`, background: alfa("gold", 0.08) }}><Link2 size={12} /> colar link</span>}
                </td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  {t.pendencia ? <span style={{ fontSize: 11, fontWeight: 700, color: corPendencia(t.pendencia) }}>{t.pendencia}</span> : <span style={{ color: C.faint }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
