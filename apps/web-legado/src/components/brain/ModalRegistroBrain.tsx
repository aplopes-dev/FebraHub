"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { MarkdownLeve } from "@/components/brain/MarkdownLeve";
import { ModalCentro } from "@/components/ui/ModalCentro";
import { rotuloFonte } from "@/lib/brain/fontes";
import { lerPaginaBrain } from "@/services/api/brain";
import { ErroApi } from "@/services/api/client";
import { C, alfa } from "@/lib/tema";

export function ModalRegistroBrain({
  slug,
  tituloFallback,
  fonteFallback,
  onFechar,
}: {
  slug: string;
  tituloFallback?: string;
  fonteFallback?: string;
  onFechar: () => void;
}) {
  const pagina = useQuery({
    queryKey: ["brain-pagina", slug],
    queryFn: () => lerPaginaBrain(slug),
    staleTime: 5 * 60_000,
  });

  const titulo = pagina.data?.titulo || tituloFallback || "Registro da memória";
  const fonte = pagina.data?.fonte || fonteFallback || "";

  return (
    <ModalCentro
      titulo={
        <span style={{ display: "flex", flexDirection: "column", gap: 3, paddingRight: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.bright, lineHeight: 1.3 }}>
            {titulo}
          </span>
          {fonte && (
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>
              Área {rotuloFonte(fonte)}
            </span>
          )}
        </span>
      }
      onFechar={onFechar}
      largura={640}
    >
      {pagina.isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", color: C.faint }}>
          <Loader2 size={16} className="girar" style={{ color: C.gold }} />
          Abrindo o registro…
        </div>
      )}

      {pagina.isError && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 9,
            border: `1px solid ${alfa("down", 0.35)}`,
            background: alfa("down", 0.08),
            fontSize: 13,
            color: C.down,
            lineHeight: 1.5,
          }}
        >
          {pagina.error instanceof ErroApi
            ? pagina.error.mensagem
            : "Não foi possível abrir este registro."}
        </div>
      )}

      {pagina.data && (
        <ConteudoRegistro
          conteudo={limparCabecalhoDuplicado(pagina.data.conteudo, pagina.data.titulo)}
        />
      )}
    </ModalCentro>
  );
}

function ConteudoRegistro({ conteudo }: { conteudo: string }) {
  const normalizado = normalizarListasInline(conteudo);
  const metricas = extrairMetricas(normalizado, 12);
  const corpo =
    metricas.length >= 2 ? removerLinhasDeMetricas(normalizado) : normalizado;

  return (
    <div style={{ padding: "4px 2px 8px", display: "grid", gap: 12 }}>
      {metricas.length >= 2 && <GradeMetricas metricas={metricas} />}
      {corpo.trim() ? <MarkdownLeve texto={corpo} /> : null}
    </div>
  );
}

export function GradeMetricas({
  metricas,
}: {
  metricas: { rotulo: string; valor: string }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
        gap: 8,
      }}
    >
      {metricas.map((m) => (
        <div
          key={m.rotulo}
          style={{
            padding: "10px 11px",
            borderRadius: 9,
            background: alfa("sup", 0.04),
            border: `1px solid ${C.hair}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, lineHeight: 1.3 }}>
            {m.rotulo}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: C.bright,
              marginTop: 3,
              lineHeight: 1.35,
            }}
          >
            {m.valor}
          </div>
        </div>
      ))}
    </div>
  );
}

export function limparCabecalhoDuplicado(conteudo: string, titulo: string): string {
  const linhas = conteudo.replace(/\r\n/g, "\n").split("\n");
  if (!linhas.length) return conteudo;
  const primeira = linhas[0].replace(/^#+\s*/, "").trim();
  if (primeira && titulo && primeira.toLowerCase() === titulo.toLowerCase()) {
    let i = 1;
    while (i < linhas.length && !linhas[i].trim()) i += 1;
    return linhas.slice(i).join("\n").trim();
  }
  return conteudo.trim();
}

/** Quebra listas markdown coladas na mesma linha (`texto: - a: 1 - b: 2`). */
export function normalizarListasInline(texto: string): string {
  return texto
    .replace(/\r\n/g, "\n")
    .replace(/:\s+(?=[-*]\s+)/g, ":\n")
    .replace(/\s+([-*]|\d+\.)\s+(?=\*\*[^*]+\*\*\s*:)/g, "\n$1 ")
    .replace(/\s+([-*]|\d+\.)\s+(?=[^-\n*][^:\n]{0,40}:\s)/g, "\n$1 ");
}

/** Remove ruído técnico e o título duplicado do trecho da busca. */
export function trechoParaPreview(trecho: string, titulo?: string): string {
  const t = normalizarListasInline(trecho);
  const linhas = t.split("\n").filter((l) => {
    const s = l.trim();
    if (!s) return false;
    if (
      /^#{1,3}\s+/.test(s) &&
      titulo &&
      s.replace(/^#+\s*/, "").toLowerCase() === titulo.toLowerCase()
    ) {
      return false;
    }
    if (/^fonte\s*:/i.test(s)) return false;
    if (/^página gerada/i.test(s)) return false;
    if (/^---+$/.test(s)) return false;
    if (/^use esta página/i.test(s)) return false;
    return true;
  });
  return linhas.slice(0, 12).join("\n");
}

function ehLinhaMetrica(linha: string): boolean {
  return (
    /^\s*[-*]\s+\*\*(.+?)\*\*\s*:\s*(.+)$/.test(linha) ||
    /^\s*[-*]\s+([^:*][^:]{0,47}):\s*(.+)$/.test(linha)
  );
}

export function removerLinhasDeMetricas(texto: string): string {
  return texto
    .split("\n")
    .filter((l) => !ehLinhaMetrica(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extrairMetricas(
  trecho: string,
  limite = 6,
): { rotulo: string; valor: string }[] {
  const out: { rotulo: string; valor: string }[] = [];
  const normalizado = normalizarListasInline(trecho);
  for (const linha of normalizado.split("\n")) {
    const m =
      /^\s*[-*]\s+\*\*(.+?)\*\*\s*:\s*(.+)$/.exec(linha) ||
      /^\s*[-*]\s+(.+?)\s*:\s*(.+)$/.exec(linha);
    if (!m) continue;
    const rotulo = m[1].replace(/\*\*/g, "").trim();
    const valor = m[2].replace(/\*\*/g, "").trim();
    if (!rotulo || !valor) continue;
    if (rotulo.length > 48 || /fonte|vw_/i.test(rotulo)) continue;
    if (valor.length > 80) continue;
    out.push({ rotulo, valor });
    if (out.length >= limite) break;
  }
  return out;
}
