"use client";

/* "Pontos que precisam de atenção" e "Principais avanços" (spec §14/§15).
   Cada item nasce de uma regra sobre números reais no backend; aqui só se
   apresenta — com link para a tela analítica do indicador. */

import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { C, alfaDe } from "@/lib/tema";
import type { Alerta, Destaque } from "@/types/executivo";

function ItemAlerta({ a, href }: { a: Alerta; href: string }) {
  const cor = a.nivel === "vermelho" ? C.down : C.warn;
  return (
    <Link href={href} className="fh-exec-alerta" style={{ borderLeftColor: cor }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, minWidth: 0 }}>{a.titulo}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, whiteSpace: "nowrap" }}>{a.setorNome}</span>
      </div>
      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{a.situacao}</div>
      {a.impacto && (
        <div style={{ fontSize: 11, fontWeight: 800, color: cor, marginTop: 4 }}>Impacto: {a.impacto}</div>
      )}
      {a.fatores.length > 0 && (
        <div style={{ fontSize: 11, color: C.faint, marginTop: 5 }}>
          <span style={{ fontWeight: 700 }}>Possíveis fatores a investigar:</span>
          <ul style={{ margin: "3px 0 0", paddingLeft: 16 }}>
            {a.fatores.map((f) => (
              <li key={f} style={{ marginTop: 2 }}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {a.acaoSugerida && (
        <div style={{ fontSize: 11, color: C.faint, marginTop: 5 }}>
          <b style={{ color: C.muted }}>Sugestão:</b> {a.acaoSugerida}
        </div>
      )}
    </Link>
  );
}

export function AlertasDestaques({
  alertas,
  destaques,
  linkIndicador,
}: {
  alertas: Alerta[];
  destaques: Destaque[];
  linkIndicador: (codigo: string) => string;
}) {
  return (
    <div className="fh-exec-duplo">
      <section aria-label="Pontos que precisam de atenção">
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <AlertTriangle size={14} style={{ color: C.warn }} />
          <h3 style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Pontos que precisam de atenção</h3>
          <span style={{ fontSize: 11, color: C.faint }}>{alertas.length}</span>
        </div>
        {alertas.length === 0 ? (
          <div className="fh-exec-vazio">Nenhum desvio relevante identificado nas regras de acompanhamento.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {alertas.map((a) => (
              <ItemAlerta key={a.id} a={a} href={linkIndicador(a.indicador)} />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Principais avanços">
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Sparkles size={14} style={{ color: C.up }} />
          <h3 style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Principais avanços</h3>
          <span style={{ fontSize: 11, color: C.faint }}>{destaques.length}</span>
        </div>
        {destaques.length === 0 ? (
          <div className="fh-exec-vazio">Sem destaques positivos no recorte atual.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {destaques.map((d) => (
              <Link key={`${d.indicador}:${d.titulo}`} href={linkIndicador(d.indicador)}
                className="fh-exec-alerta" style={{ borderLeftColor: C.up }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright, minWidth: 0 }}>{d.titulo}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, whiteSpace: "nowrap" }}>{d.setorNome}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{d.frase}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export const CorAlfa = alfaDe;
