/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { C, alfa } from "@/lib/tema";

/* Foto da consultora. O PNG já vem circular e com moldura dourada própria,
   então nada de borda/recorte extra — só dimensiona. Se a imagem falhar ou
   não existir, cai nas iniciais em vez de quebrar o card.

   `<img>` cru de propósito: a URL vem do dado (host imprevisível) e o
   next/image exigiria whitelist de domínio pra cada fonte nova. */
export function Avatar({ url, nome, tam = 64 }: { url?: string | null; nome?: string | null; tam?: number }) {
  const [erro, setErro] = useState(false);
  const iniciais = (nome ?? "").split(/[\s.]+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("") || "?";
  if (!url || erro) {
    return (
      <div style={{
        width: tam, height: tam, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(150deg, var(--avatar-top), var(--avatar-base))",
        border: `1px solid ${alfa("gold", 0.4)}`, color: C.gold,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: Math.round(tam * 0.34),
      }}>
        {iniciais}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={nome ?? ""}
      onError={() => setErro(true)}
      style={{ width: tam, height: tam, objectFit: "contain", flexShrink: 0, display: "block" }}
    />
  );
}
