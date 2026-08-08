"use client";

import type { ReactNode } from "react";
import { C } from "@/lib/tema";

/** `**texto**` → negrito. */
function comNegrito(texto: string, chave: string): ReactNode[] {
  const partes = texto.split(/(\*\*[\s\S]+?\*\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
      return (
        <strong key={`${chave}-b${i}`} style={{ fontWeight: 800, color: C.bright }}>
          {parte.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${chave}-t${i}`}>{parte}</span>;
  });
}

/**
 * Markdown leve para respostas e registros da memória:
 * títulos (#), listas (- / * / 1.), negrito (**), linhas ---.
 */
export function MarkdownLeve({
  texto,
  compacto = false,
}: {
  texto: string;
  compacto?: boolean;
}) {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const nos: ReactNode[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const chave = `L${i}`;

    if (/^---+$/.test(linha.trim())) {
      nos.push(
        <hr
          key={chave}
          style={{
            border: "none",
            borderTop: `1px solid ${C.hair}`,
            margin: compacto ? "10px 0" : "14px 0",
          }}
        />,
      );
      continue;
    }

    const titulo = /^(#{1,3})\s+(.+)$/.exec(linha);
    if (titulo) {
      const nivel = titulo[1].length;
      nos.push(
        <div
          key={chave}
          style={{
            fontWeight: 800,
            color: C.bright,
            fontSize: compacto
              ? nivel === 1 ? 14.5 : 13.5
              : nivel === 1 ? 16 : nivel === 2 ? 15 : 14,
            marginTop: i === 0 ? 0 : compacto ? 10 : 14,
            marginBottom: 6,
            lineHeight: 1.35,
          }}
        >
          {comNegrito(titulo[2], chave)}
        </div>,
      );
      continue;
    }

    const item = /^(\s*)([-*]|\d+\.)\s+(.+)$/.exec(linha);
    if (item) {
      nos.push(
        <div
          key={chave}
          style={{
            display: "flex",
            gap: 8,
            padding: "3px 0",
            fontSize: compacto ? 13 : 13.5,
            color: C.text,
            lineHeight: 1.55,
          }}
        >
          <span style={{ flexShrink: 0, color: C.gold, fontWeight: 800, minWidth: 14 }}>
            {item[2] === "-" || item[2] === "*" ? "•" : item[2]}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>{comNegrito(item[3], chave)}</span>
        </div>,
      );
      continue;
    }

    if (!linha.trim()) {
      nos.push(<div key={chave} style={{ height: compacto ? 6 : 8 }} />);
      continue;
    }

    nos.push(
      <div
        key={chave}
        style={{
          fontSize: compacto ? 13 : 13.5,
          color: C.text,
          lineHeight: 1.6,
          padding: "2px 0",
        }}
      >
        {comNegrito(linha, chave)}
      </div>,
    );
  }

  return <div>{nos}</div>;
}
