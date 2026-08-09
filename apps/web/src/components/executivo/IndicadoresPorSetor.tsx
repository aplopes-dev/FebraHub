"use client";

/* Cards da visão geral agrupados por setor — faixas visuais por bloco. */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { C, alfaDe } from "@/lib/tema";
import { HUBS } from "@/lib/hubs";
import type { BlocoSetor, CardIndicador, ModoComparacao } from "@/types/executivo";
import { CardExecutivo } from "./CardIndicador";

export function IndicadoresPorSetor({
  setores,
  cards,
  modo,
  linkIndicador,
}: {
  setores: BlocoSetor[];
  cards: CardIndicador[];
  modo: ModoComparacao;
  linkIndicador: (codigo: string) => string;
}) {
  const grupos = setores
    .map((s) => {
      const doSetor = cards.filter((c) => c.setor === s.setor);
      return { bloco: s, cards: doSetor };
    })
    .filter((g) => g.cards.length > 0);

  const setoresComBloco = new Set(setores.map((s) => s.setor));
  const orfaos = cards.filter((c) => !setoresComBloco.has(c.setor));
  if (orfaos.length > 0) {
    const porNome = new Map<string, CardIndicador[]>();
    for (const c of orfaos) {
      const lista = porNome.get(c.setor) ?? [];
      lista.push(c);
      porNome.set(c.setor, lista);
    }
    for (const [setor, lista] of porNome) {
      grupos.push({
        bloco: {
          setor,
          nome: lista[0].setorNome,
          indicadores: lista.map((c) => c.codigo),
          alertas: 0,
          destaques: 0,
          qualidade: "ok",
        },
        cards: lista,
      });
    }
  }

  if (grupos.length === 0) {
    return (
      <div className="fh-exec-vazio">
        Todos os cards estão ocultos — reative em “Personalizar”.
      </div>
    );
  }

  return (
    <div className="fh-exec-por-setor">
      {grupos.map(({ bloco, cards: doSetor }, gi) => {
        const hub = HUBS.find((h) => h.key === bloco.setor);
        return (
          <section
            key={bloco.setor}
            className="fh-exec-setor-grupo fh-exec-reveal"
            aria-label={`Setor ${bloco.nome}`}
            style={{ animationDelay: `${gi * 70}ms` }}
          >
            <div className="fh-exec-setor-faixa">
              <div className="fh-exec-setor-cabeca">
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.bright, letterSpacing: "-.2px" }}>
                    {bloco.nome}
                  </h3>
                  {bloco.alertas > 0 && (
                    <span
                      className="fh-exec-badge"
                      style={{
                        color: C.warn,
                        background: alfaDe(C.warn, 0.14),
                        borderColor: alfaDe(C.warn, 0.28),
                      }}
                    >
                      {bloco.alertas} {bloco.alertas === 1 ? "alerta" : "alertas"}
                    </span>
                  )}
                </div>
                {hub && (
                  <Link href={`/${bloco.setor}`} className="fh-exec-setor-link">
                    Abrir hub <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            </div>
            <div className="fh-exec-grid fh-exec-grid-setor">
              {doSetor.map((c) => (
                <CardExecutivo
                  key={c.codigo}
                  card={c}
                  modo={modo}
                  href={linkIndicador(c.codigo)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
