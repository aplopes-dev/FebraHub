"use client";

import { PaginaCrud } from "@/components/cadastros/PaginaCrud";
import { BadgeOrigem } from "@/components/cadastros/TabelaCrud";
import type { CampoCrud, ColunaCrud } from "@/components/cadastros/tipos";
import { moeda } from "@/lib/formato";
import { lojaCadastros, type ReceitaExtra } from "@/services/api/loja-cadastros";

const colunas: ColunaCrud<ReceitaExtra>[] = [
  { chave: "data_venda", label: "Data" },
  { chave: "fonte", label: "Fonte" },
  { chave: "descricao", label: "Descrição", sumirMobile: true },
  { chave: "cliente", label: "Cliente", sumirMobile: true },
  { chave: "valor", label: "Valor", alinhar: "right", render: (r) => moeda(r.valor) },
  { chave: "origem", label: "Origem", render: (r) => <BadgeOrigem origem={r.origem} /> },
];

const campos: CampoCrud[] = [
  { name: "fonte", label: "Fonte", tipo: "text", obrigatorio: true, placeholder: "Premium, Aluguel…" },
  { name: "data_venda", label: "Data da venda", tipo: "date" },
  { name: "mes_ref", label: "Mês de competência", tipo: "month" },
  { name: "valor", label: "Valor", tipo: "number", min: 0 },
  { name: "quantidade", label: "Quantidade", tipo: "number", min: 0 },
  { name: "forma_pagto", label: "Forma de pagamento", tipo: "text" },
  { name: "descricao", label: "Descrição", tipo: "text", span: 2 },
  { name: "cliente", label: "Cliente", tipo: "text" },
  { name: "documento", label: "Documento", tipo: "text" },
  { name: "observacao", label: "Observação", tipo: "textarea", span: 2 },
];

export function CrudReceitasExtras() {
  return (
    <PaginaCrud<ReceitaExtra>
      colunas={colunas}
      campos={campos}
      chaveLinha={(r) => r.id}
      tituloNovo="Nova receita extra"
      tituloEditar="Editar receita extra"
      carregar={lojaCadastros.receitas}
      salvar={async (v, editando) => {
        if (editando) await lojaCadastros.atualizarReceita(editando.id, v);
        else await lojaCadastros.criarReceita(v);
      }}
      apagar={async (r) => { await lojaCadastros.apagarReceita(r.id); }}
      valoresDe={(r) => ({
        fonte: r.fonte ?? "",
        data_venda: r.data_venda ?? "",
        mes_ref: r.mes_ref ?? "",
        descricao: r.descricao ?? "",
        forma_pagto: r.forma_pagto ?? "",
        valor: r.valor ?? "",
        quantidade: r.quantidade ?? "",
        cliente: r.cliente ?? "",
        documento: r.documento ?? "",
        observacao: r.observacao ?? "",
      })}
    />
  );
}
