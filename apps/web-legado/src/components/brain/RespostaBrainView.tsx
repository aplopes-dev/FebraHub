"use client";

/* Exibe a resposta da memória em linguagem natural — sem slug, score ou jargão.
   Citações são clicáveis: abrem o registro completo em modal. */

import { useState } from "react";
import { BookMarked, ChevronRight } from "lucide-react";
import { MarkdownLeve } from "@/components/brain/MarkdownLeve";
import { ModalRegistroBrain } from "@/components/brain/ModalRegistroBrain";
import { rotuloFonte } from "@/lib/brain/fontes";
import { C, SANS, alfa } from "@/lib/tema";
import type { RespostaBrain } from "@/types/brain";

export function RespostaBrainView({
  resposta,
  compacto = false,
}: {
  resposta: RespostaBrain;
  compacto?: boolean;
}) {
  const [slugAberto, setSlugAberto] = useState<string | null>(null);
  const citacaoAberta = resposta.citacoes.find((c) => c.slug === slugAberto) ?? null;

  const texto =
    resposta.resposta?.trim() ||
    "Ainda não encontrei material suficiente na memória para responder isso com segurança.";

  return (
    <div>
      <MarkdownLeve texto={texto} compacto={compacto} />

      {resposta.citacoes.length > 0 && (
        <div style={{ marginTop: compacto ? 12 : 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: C.dim,
              marginBottom: 7,
            }}
          >
            <BookMarked size={12} />
            Com base nestes registros
            <span style={{ fontWeight: 600, color: C.faint }}>— toque para abrir</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {resposta.citacoes.map((c, i) => (
              <button
                key={`${c.slug}-${i}`}
                type="button"
                onClick={() => setSlugAberto(c.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 11px",
                  borderRadius: 8,
                  border: `1px solid ${C.cardLine}`,
                  background: alfa("sup", 0.03),
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: SANS,
                  width: "100%",
                  transition: "background .12s ease, border-color .12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = alfa("gold", 0.08);
                  e.currentTarget.style.borderColor = alfa("gold", 0.35);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = alfa("sup", 0.03);
                  e.currentTarget.style.borderColor = C.cardLine;
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10.5,
                    fontWeight: 800,
                    color: C.gold,
                    minWidth: 16,
                  }}
                >
                  {i + 1}.
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: compacto ? 12 : 12.5,
                      fontWeight: 700,
                      color: C.bright,
                      lineHeight: 1.35,
                    }}
                  >
                    {c.titulo || "Registro da memória"}
                  </span>
                  <span style={{ fontSize: 11, color: C.faint }}>
                    Área {rotuloFonte(c.fonte)}
                  </span>
                </span>
                <ChevronRight size={14} style={{ color: C.dim, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {!!resposta.lacunas?.length && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 11px",
            borderRadius: 8,
            border: `1px solid ${alfa("warn", 0.35)}`,
            background: alfa("warn", 0.08),
            fontSize: 12,
            color: C.warn,
            lineHeight: 1.5,
          }}
        >
          Ainda falta registrar: {resposta.lacunas.join("; ")}.
        </div>
      )}

      {slugAberto && (
        <ModalRegistroBrain
          slug={slugAberto}
          tituloFallback={citacaoAberta?.titulo}
          fonteFallback={citacaoAberta?.fonte}
          onFechar={() => setSlugAberto(null)}
        />
      )}
    </div>
  );
}
