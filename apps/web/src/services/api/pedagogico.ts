import { api } from "./client";
import type { ListaCrud } from "@/components/cadastros/tipos";
import type { AnotacaoParaGravar, AvaliacaoParaGravar, RetencaoParaGravar } from "@/types/views";

export type AvaliacaoCurso = {
  id: number;
  fonte: string | null;
  curso: string | null;
  treinador: string | null;
  data_curso: string | null;
  turma: string | null;
  respondentes: number | null;
  q_conteudo: number | null;
  q_clareza: number | null;
  q_material: number | null;
  q_aplicacao: number | null;
  q_dominio: number | null;
  q_pontualidade: number | null;
  q_duvidas: number | null;
  nps: number | null;
  nota_treinador: number | null;
  comentario: string | null;
  criado_em: string | null;
};

export type AvaliacaoEventoRow = {
  id: number;
  evento: string | null;
  data_evento: string | null;
  nota_indicacao: number | null;
  comentario: string | null;
  respostas: string | null;
  resposta_id: string | null;
  criado_em: string | null;
};

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function salvarAvaliacao(registro: AvaliacaoParaGravar): Promise<void> {
  await api.post<void>("/pedagogico/avaliacoes", registro);
}

export async function listarAvaliacoes(pagina: number, filtro: Record<string, string> = {}) {
  return api.get<ListaCrud<AvaliacaoCurso>>(
    `/pedagogico/avaliacoes${qs({ pagina, fonte: "ggb", ...filtro })}`,
  );
}

export async function atualizarAvaliacao(id: number, body: Record<string, unknown>) {
  return api.put(`/pedagogico/avaliacoes/${id}`, body);
}

export async function apagarAvaliacao(id: number) {
  return api.delete(`/pedagogico/avaliacoes/${id}`);
}

export async function listarAvaliacoesEvento(pagina: number, filtro: Record<string, string> = {}) {
  const resto = { ...filtro };
  delete resto.mes;
  return api.get<ListaCrud<AvaliacaoEventoRow>>(
    `/pedagogico/avaliacoes-evento${qs({ pagina, ...resto })}`,
  );
}

export async function salvarAvaliacaoEvento(body: Record<string, unknown>) {
  return api.post("/pedagogico/avaliacoes-evento", body);
}

export async function atualizarAvaliacaoEvento(id: number, body: Record<string, unknown>) {
  return api.put(`/pedagogico/avaliacoes-evento/${id}`, body);
}

export async function apagarAvaliacaoEvento(id: number) {
  return api.delete(`/pedagogico/avaliacoes-evento/${id}`);
}

export async function salvarMaestroAnotacao(anotacao: AnotacaoParaGravar): Promise<void> {
  await api.put<void>(`/pedagogico/maestros/${encodeURIComponent(anotacao.aluno_id)}/anotacao`, anotacao);
}

export async function salvarRetencao(registro: RetencaoParaGravar): Promise<void> {
  const { id, ...campos } = registro;
  if (id != null) await api.put<void>(`/pedagogico/retencao/${id}`, campos);
  else await api.post<void>("/pedagogico/retencao", campos);
}
