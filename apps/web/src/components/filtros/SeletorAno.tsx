"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { itemPop } from "@/components/ui/estilos";
import { usePeriodo } from "@/lib/periodo";
import { C, SANS, alfa } from "@/lib/tema";

/* Ano: dropdown com os anos que têm dado + "Geral" (todo o histórico).
   "Geral" é acumulado: zera o recorte de ano. Só o Hub Loja lê a flag hoje;
   nos demais hubs o recorte vira a base inteira, o que é uma visão válida. */
export function SeletorAno() {
  const { ano, setAno, anos, geral, setGeral } = usePeriodo();
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAberto((v) => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12,
        fontWeight: 700, color: C.gold, background: alfa("sup", 0.04),
        border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "6px 10px", cursor: "pointer",
      }}>
        {geral ? "Geral" : ano} <ChevronDown size={13} />
      </button>
      <Popover aberto={aberto} onFechar={() => setAberto(false)} largura={110}>
        <button style={itemPop(geral)} onClick={() => { setGeral(true); setAberto(false); }}>Geral</button>
        {anos.map((a) => (
          <button key={a} style={itemPop(!geral && a === ano)} onClick={() => { setAno(a); setAberto(false); }}>{a}</button>
        ))}
      </Popover>
    </div>
  );
}
