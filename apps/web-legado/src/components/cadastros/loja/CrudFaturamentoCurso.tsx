"use client";

import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import { BadgeOrigem } from "@/components/cadastros/TabelaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { moeda } from "@/lib/formato";
import { lojaCadastros, type FaturamentoCurso } from "@/services/api/loja-cadastros";

const colunas: ColunaCrud<FaturamentoCurso>[] = [
  { chave: "mes_ref", label: "Mês" },
  { chave: "curso", label: "Curso" },
  { chave: "turma", label: "Turma", sumirMobile: true },
  { chave: "treinador", label: "Treinador", sumirMobile: true },
  { chave: "total", label: "Total", alinhar: "right", render: (r) => moeda(r.total) },
  { chave: "meta", label: "Meta", alinhar: "right", render: (r) => moeda(r.meta), sumirMobile: true },
  { chave: "origem", label: "Origem", render: (r) => <BadgeOrigem origem={r.origem} /> },
];

const campos: CampoCrud[] = [
  { name: "mes_ref", label: "Mês", tipo: "month", obrigatorio: true },
  { name: "curso", label: "Curso", tipo: "text", obrigatorio: true },
  { name: "turma", label: "Turma", tipo: "text" },
  { name: "treinador", label: "Treinador", tipo: "text" },
  { name: "periodo", label: "Período", tipo: "text" },
  { name: "alunos", label: "Alunos", tipo: "number", min: 0 },
  { name: "dinheiro", label: "Dinheiro", tipo: "number", min: 0 },
  { name: "debito", label: "Débito", tipo: "number", min: 0 },
  { name: "credito", label: "Crédito", tipo: "number", min: 0 },
  { name: "pix", label: "Pix", tipo: "number", min: 0 },
  { name: "total", label: "Total", tipo: "number", min: 0 },
  { name: "meta", label: "Meta", tipo: "number", min: 0 },
  { name: "ticket_medio", label: "Ticket médio", tipo: "number", min: 0, span: 2 },
];

export function CrudFaturamentoCurso() {
  return (
    <PaginaCrud<FaturamentoCurso>
      colunas={colunas}
      campos={campos}
      chaveLinha={(r) => r.id}
      tituloNovo="Novo faturamento"
      tituloEditar="Editar faturamento"
      carregar={lojaCadastros.faturamento}
      salvar={async (v, editando) => {
        if (editando) await lojaCadastros.atualizarFaturamento(editando.id, v);
        else await lojaCadastros.criarFaturamento(v);
      }}
      apagar={async (r) => { await lojaCadastros.apagarFaturamento(r.id); }}
      valoresDe={(r) => ({
        mes_ref: r.mes_ref ?? "",
        curso: r.curso ?? "",
        turma: r.turma ?? "",
        treinador: r.treinador ?? "",
        periodo: r.periodo ?? "",
        dinheiro: r.dinheiro ?? "",
        debito: r.debito ?? "",
        credito: r.credito ?? "",
        pix: r.pix ?? "",
        total: r.total ?? "",
        meta: r.meta ?? "",
        alunos: r.alunos ?? "",
        ticket_medio: r.ticket_medio ?? "",
      })}
    />
  );
}
