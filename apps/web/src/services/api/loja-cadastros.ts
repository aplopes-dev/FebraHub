import { api } from "./client";
import type { ListaCrud } from "@/components/cadastros/tipos";

export type MetaMes = {
  mes_ref: string;
  ano: number | null;
  mes_nome: string | null;
  minima: number | null;
  basica: number | null;
  master: number | null;
  origem: string;
  atualizado_em: string | null;
};

export type MetaCurso = {
  mes_ref: string;
  curso: string;
  meta_produtos: number | null;
  meta_curso: number | null;
  meta_total: number | null;
  alunos: number | null;
  origem: string;
  atualizado_em: string | null;
};

export type FaturamentoCurso = {
  id: number;
  mes_ref: string | null;
  curso: string | null;
  turma: string | null;
  treinador: string | null;
  periodo: string | null;
  dinheiro: number | null;
  debito: number | null;
  credito: number | null;
  pix: number | null;
  total: number | null;
  meta: number | null;
  alunos: number | null;
  ticket_medio: number | null;
  origem: string;
  atualizado_em: string | null;
};

export type ReceitaExtra = {
  id: number;
  fonte: string | null;
  data_venda: string | null;
  mes_ref: string | null;
  descricao: string | null;
  forma_pagto: string | null;
  valor: number | null;
  quantidade: number | null;
  cliente: string | null;
  documento: string | null;
  observacao: string | null;
  chave_origem: string | null;
  origem: string;
  atualizado_em: string | null;
};

export type Fechamento = {
  mes_ref: string;
  ano: number | null;
  mes_nome: string | null;
  faturamento: number | null;
  meta_minima: number | null;
  meta_basica: number | null;
  meta_master: number | null;
  detalhe: string | null;
  origem: string;
  atualizado_em: string | null;
};

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const lojaCadastros = {
  metasMes: (pagina: number, filtro: Record<string, string>) =>
    api.get<ListaCrud<MetaMes>>(`/loja/cadastros/metas-mes${qs({ pagina, ...filtro })}`),
  salvarMetaMes: (body: Record<string, unknown>) =>
    api.post("/loja/cadastros/metas-mes", body),
  apagarMetaMes: (mes: string) =>
    api.delete(`/loja/cadastros/metas-mes/${mes}`),

  metasCurso: (pagina: number, filtro: Record<string, string>) =>
    api.get<ListaCrud<MetaCurso>>(`/loja/cadastros/metas-curso${qs({ pagina, ...filtro })}`),
  salvarMetaCurso: (body: Record<string, unknown>) =>
    api.post("/loja/cadastros/metas-curso", body),
  apagarMetaCurso: (mes: string, curso: string) =>
    api.delete(`/loja/cadastros/metas-curso/${mes}/${encodeURIComponent(curso)}`),

  faturamento: (pagina: number, filtro: Record<string, string>) =>
    api.get<ListaCrud<FaturamentoCurso>>(`/loja/cadastros/faturamento-curso${qs({ pagina, ...filtro })}`),
  criarFaturamento: (body: Record<string, unknown>) =>
    api.post("/loja/cadastros/faturamento-curso", body),
  atualizarFaturamento: (id: number, body: Record<string, unknown>) =>
    api.put(`/loja/cadastros/faturamento-curso/${id}`, body),
  apagarFaturamento: (id: number) =>
    api.delete(`/loja/cadastros/faturamento-curso/${id}`),

  receitas: (pagina: number, filtro: Record<string, string>) =>
    api.get<ListaCrud<ReceitaExtra>>(`/loja/cadastros/receitas-extras${qs({ pagina, ...filtro })}`),
  criarReceita: (body: Record<string, unknown>) =>
    api.post("/loja/cadastros/receitas-extras", body),
  atualizarReceita: (id: number, body: Record<string, unknown>) =>
    api.put(`/loja/cadastros/receitas-extras/${id}`, body),
  apagarReceita: (id: number) =>
    api.delete(`/loja/cadastros/receitas-extras/${id}`),

  fechamento: (pagina: number, filtro: Record<string, string>) =>
    api.get<ListaCrud<Fechamento>>(`/loja/cadastros/fechamento${qs({ pagina, ...filtro })}`),
  salvarFechamento: (body: Record<string, unknown>) =>
    api.post("/loja/cadastros/fechamento", body),
  apagarFechamento: (mes: string) =>
    api.delete(`/loja/cadastros/fechamento/${mes}`),
};
