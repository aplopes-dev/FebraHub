"use client";

import { useRef, useState } from "react";
import { CardPodio, type ItemPodio } from "./CardPodio";
import { C, GROTESK } from "@/lib/tema";
import { moeda, numero } from "@/lib/formato";

export interface CursoDoPodio {
  curso: string;
  curso_curto?: string | null;
  vendas: number;
  receita: number;
}

/* Envolve o CardPodio (sem tocar nele) e revela os cursos da consultora.
   O tooltip é `fixed` porque o Bloco tem overflow:hidden e cortaria um
   absolute. Clique também abre/fecha — TV não tem mouse. */
export function CardComCursos({ c, pos, cursos }: { c: ItemPodio; pos: number; cursos?: readonly CursoDoPodio[] }) {
  const [ancora, setAncora] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const tem = !!cursos && cursos.length > 0;
  const abrir = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setAncora({ x: r.left + r.width / 2, y: r.bottom + 6 });
  };
  const fechar = () => setAncora(null);
  return (
    <div
      ref={ref}
      style={{ position: "relative", cursor: tem ? "pointer" : "default" }}
      onMouseEnter={tem ? abrir : undefined}
      onMouseLeave={tem ? fechar : undefined}
      onClick={tem ? () => (ancora ? fechar() : abrir()) : undefined}
    >
      <CardPodio c={c} pos={pos} />
      {tem && ancora && (
        <div style={{
          position: "fixed", left: ancora.x, top: ancora.y, transform: "translateX(-50%)",
          zIndex: 60, pointerEvents: "none",
          background: "#15151a", border: `1px solid ${C.cardLine}`, borderRadius: 10,
          padding: "9px 11px", minWidth: 220, maxWidth: 300,
          boxShadow: "0 12px 32px rgba(0,0,0,.55)",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".4px", textTransform: "uppercase", color: C.gold, marginBottom: 5 }}>
            Top cursos · {c.consultora}
          </div>
          {cursos?.map((cu) => (
            <div key={cu.curso} style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: C.bright, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cu.curso}>
                {cu.curso_curto ?? cu.curso}
              </span>
              <span style={{ fontSize: 9.5, color: C.faint, flexShrink: 0 }}>{numero(cu.vendas)}×</span>
              <span style={{ fontFamily: GROTESK, fontSize: 11.5, fontWeight: 700, color: C.gold, flexShrink: 0 }}>
                {moeda(cu.receita)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
