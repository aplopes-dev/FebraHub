"use client";

/* Lista de achados da busca — cards compactos; clique abre o registro completo. */

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  GradeMetricas,
  ModalRegistroBrain,
  extrairMetricas,
  removerLinhasDeMetricas,
  trechoParaPreview,
} from "@/components/brain/ModalRegistroBrain";
import { MarkdownLeve } from "@/components/brain/MarkdownLeve";
import { Estado } from "@/components/ui/Estado";
import { rotuloFonte } from "@/lib/brain/fontes";
import { C, SANS, alfa } from "@/lib/tema";
import type { ResultadoBrain } from "@/types/brain";

export function ResultadosBuscaView({ achados }: { achados: ResultadoBrain[] }) {
  const [slugAberto, setSlugAberto] = useState<string | null>(null);
  const aberto = achados.find((a) => a.slug === slugAberto) ?? null;

  return (
    <Estado
      vazio={achados.length === 0}
      vazioTitulo="Nada encontrado"
      vazioDica="Pode ser que o assunto ainda não tenha sido registrado, ou que ele viva numa área fora do seu acesso."
    >
      <div style={{ display: "grid", gap: 10 }}>
        {achados.map((a) => {
          const preview = trechoParaPreview(a.trecho || "", a.titulo);
          const metricas = extrairMetricas(preview, 6);
          const resumo =
            metricas.length >= 2
              ? resumirProsa(removerLinhasDeMetricas(preview))
              : preview;
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => setSlugAberto(a.slug)}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.cardLine}`,
                background: alfa("sup", 0.03),
                cursor: "pointer",
                textAlign: "left",
                fontFamily: SANS,
                transition: "background .12s ease, border-color .12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = alfa("gold", 0.07);
                e.currentTarget.style.borderColor = alfa("gold", 0.35);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = alfa("sup", 0.03);
                e.currentTarget.style.borderColor = C.cardLine;
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: C.bright, lineHeight: 1.3 }}>
                      {a.titulo || "Registro sem título"}
                    </h3>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 6,
                        background: alfa("gold", 0.12),
                        color: C.gold,
                      }}
                    >
                      {rotuloFonte(a.fonte)}
                    </span>
                  </div>

                  {resumo ? (
                    <div style={{ marginTop: 8, opacity: 0.95 }}>
                      <MarkdownLeve texto={resumo} compacto />
                    </div>
                  ) : null}

                  {metricas.length >= 2 ? (
                    <div style={{ marginTop: 10 }}>
                      <GradeMetricas metricas={metricas} />
                    </div>
                  ) : null}

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.gold,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Ver registro completo
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {slugAberto && (
        <ModalRegistroBrain
          slug={slugAberto}
          tituloFallback={aberto?.titulo}
          fonteFallback={aberto?.fonte}
          onFechar={() => setSlugAberto(null)}
        />
      )}
    </Estado>
  );
}

function resumirProsa(texto: string): string {
  const limpo = texto
    .replace(/^#{1,3}\s+.+$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (!limpo) return "";
  const primeira = limpo.split("\n").find((l) => l.trim().length > 12) || limpo;
  return primeira.length > 180 ? `${primeira.slice(0, 177).trim()}…` : primeira;
}
