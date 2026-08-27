"use client";

import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import { BadgeOrigem } from "@/components/cadastros/TabelaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { moeda } from "@/lib/formato";
import { lojaCadastros, type Fechamento } from "@/services/api/loja-cadastros";

const colunas: ColunaCrud<Fechamento>[] = [
  { chave: "mes_ref", label: "Mês", render: (r) => r.mes_nome ?? r.mes_ref },
  { chave: "faturamento", label: "Faturamento", alinhar: "right", render: (r) => moeda(r.faturamento) },
  { chave: "meta_minima", label: "Mínima", alinhar: "right", render: (r) => moeda(r.meta_minima), sumirMobile: true },
  { chave: "meta_basica", label: "Básica", alinhar: "right", render: (r) => moeda(r.meta_basica), sumirMobile: true },
  { chave: "meta_master", label: "Máster", alinhar: "right", render: (r) => moeda(r.meta_master), sumirMobile: true },
  { chave: "origem", label: "Origem", render: (r) => <BadgeOrigem origem={r.origem} /> },
];

const campos: CampoCrud[] = [
  { name: "mes_ref", label: "Mês", tipo: "month", obrigatorio: true, span: 2 },
  { name: "faturamento", label: "Faturamento", tipo: "number", min: 0, span: 2 },
  { name: "meta_minima", label: "Meta mínima", tipo: "number", min: 0 },
  { name: "meta_basica", label: "Meta básica", tipo: "number", min: 0 },
  { name: "meta_master", label: "Meta máster", tipo: "number", min: 0, span: 2 },
  { name: "detalhe", label: "Detalhe", tipo: "textarea", span: 2 },
];

export function CrudFechamento() {
  return (
    <PaginaCrud<Fechamento>
      colunas={colunas}
      campos={campos}
      chaveLinha={(r) => r.mes_ref}
      tituloNovo="Novo fechamento"
      tituloEditar="Editar fechamento"
      carregar={lojaCadastros.fechamento}
      salvar={async (v) => { await lojaCadastros.salvarFechamento(v); }}
      apagar={async (r) => { await lojaCadastros.apagarFechamento(r.mes_ref); }}
      valoresDe={(r) => ({
        mes_ref: r.mes_ref,
        faturamento: r.faturamento ?? "",
        meta_minima: r.meta_minima ?? "",
        meta_basica: r.meta_basica ?? "",
        meta_master: r.meta_master ?? "",
        detalhe: r.detalhe ?? "",
      })}
    />
  );
}
