"use client";

import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import { BadgeOrigem } from "@/components/cadastros/TabelaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { moeda } from "@/lib/formato";
import { lojaCadastros, type MetaCurso } from "@/services/api/loja-cadastros";

const colunas: ColunaCrud<MetaCurso>[] = [
  { chave: "mes_ref", label: "Mês" },
  { chave: "curso", label: "Curso" },
  { chave: "meta_produtos", label: "Meta produtos", alinhar: "right", render: (r) => moeda(r.meta_produtos), sumirMobile: true },
  { chave: "meta_curso", label: "Meta curso", alinhar: "right", render: (r) => moeda(r.meta_curso), sumirMobile: true },
  { chave: "meta_total", label: "Total", alinhar: "right", render: (r) => moeda(r.meta_total) },
  { chave: "alunos", label: "Alunos", alinhar: "right", sumirMobile: true },
  { chave: "origem", label: "Origem", render: (r) => <BadgeOrigem origem={r.origem} /> },
];

const campos: CampoCrud[] = [
  { name: "mes_ref", label: "Mês", tipo: "month", obrigatorio: true },
  { name: "curso", label: "Curso", tipo: "text", obrigatorio: true },
  { name: "meta_produtos", label: "Meta produtos", tipo: "number", min: 0 },
  { name: "meta_curso", label: "Meta curso", tipo: "number", min: 0 },
  { name: "meta_total", label: "Meta total", tipo: "number", min: 0 },
  { name: "alunos", label: "Alunos", tipo: "number", min: 0 },
];

export function CrudMetasCurso() {
  return (
    <PaginaCrud<MetaCurso>
      colunas={colunas}
      campos={campos}
      chaveLinha={(r) => `${r.mes_ref}|${r.curso}`}
      tituloNovo="Nova meta por curso"
      tituloEditar="Editar meta por curso"
      carregar={lojaCadastros.metasCurso}
      salvar={async (v) => { await lojaCadastros.salvarMetaCurso(v); }}
      apagar={async (r) => { await lojaCadastros.apagarMetaCurso(r.mes_ref, r.curso); }}
      valoresDe={(r) => ({
        mes_ref: r.mes_ref,
        curso: r.curso,
        meta_produtos: r.meta_produtos ?? "",
        meta_curso: r.meta_curso ?? "",
        meta_total: r.meta_total ?? "",
        alunos: r.alunos ?? "",
      })}
    />
  );
}
