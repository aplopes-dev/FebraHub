"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { itemPop } from "@/components/ui/estilos";
import { moeda } from "@/lib/formato";
import { C, SANS } from "@/lib/tema";

export interface ProdutoMkt {
  nome: string;
  gasto: number;
}

/* Categoria do Marketing = produto da campanha. Vocabulário próprio ("FCIS",
   "EG", "CIS 247"…), sem interseção com as categorias do Comercial — por
   isso não usa o seletor global. São dezenas de valores: dropdown, não
   barra de botões. Aqui "todos" faz sentido (é um orçamento só de mídia),
   ao contrário do Comercial, onde categoria é unidade de negócio separada. */
export function SeletorProduto({
  produtos, valor, onChange,
}: {
  produtos: readonly ProdutoMkt[];
  valor: string | null;
  onChange: (v: string | null) => void;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: ".5px" }}>Categoria</span>
      <button onClick={() => setAberto((v) => !v)} style={{
        display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 11.5,
        fontWeight: 700, color: C.gold, background: "rgba(255,255,255,.04)",
        border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "6px 10px",
        cursor: "pointer", maxWidth: 240,
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {valor ?? "Todos os produtos"}
        </span>
        <ChevronDown size={13} style={{ flexShrink: 0 }} />
      </button>
      <Popover aberto={aberto} onFechar={() => setAberto(false)} largura={252}>
        <button style={itemPop(valor == null)} onClick={() => { onChange(null); setAberto(false); }}>
          Todos os produtos
        </button>
        {produtos.map((p) => (
          <button key={p.nome} style={itemPop(valor === p.nome)}
            onClick={() => { onChange(p.nome); setAberto(false); }}>
            {p.nome} · {moeda(p.gasto)}
          </button>
        ))}
      </Popover>
    </div>
  );
}
