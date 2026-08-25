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

// ============================================================
// PEDAGÓGICO P0 — Secretaria Digital do Aluno
// ============================================================

export interface PedagogicoTurma {
  id: string; nome: string; cursoNome: string; cursoId?: string | null;
  turmaIdSf?: string | null; unidade?: string | null; local?: string | null;
  endereco?: string | null; dataInicio?: string | null; dataFim?: string | null;
  horarioInicio?: string | null; horarioFim?: string | null;
  horarioCredenciamento?: string | null; treinador?: string | null;
  responsavelId?: string | null; capacidade?: number | null; status: string;
  linkGrupo?: string | null; observacoes?: string | null;
  criadoEm?: string | null; atualizadoEm?: string | null;
  matriculados?: number; confirmados?: number; presentes?: number;
  represados?: number; credenciados?: number;
}

export interface PedagogicoMatricula {
  id: string; pessoaId: string; pessoaNome?: string | null;
  pessoaCpf?: string | null; pessoaEmail?: string | null;
  pessoaTelefone?: string | null; status: string;
  dataCompra?: string | null; dataMatricula?: string | null;
  validadeFim?: string | null; origem?: string | null;
  cursoNome?: string | null; unidade?: string | null; criadoEm?: string | null;
  turma?: { id: string; nome: string; cursoNome: string; dataInicio?: string | null; dataFim?: string | null; unidade?: string | null; status: string } | null;
  credenciado?: boolean; credenciadoEm?: string | null;
  totalPresencas?: number;
  ultimaConfirmacao?: { status: string; canal: string; criadoEm: string } | null;
}

export interface PedagogicoDashboard {
  turmasProximas: Array<{ id: string; nome: string; cursoNome: string; unidade?: string | null; dataInicio?: string | null; dataFim?: string | null; capacidade?: number | null; status: string; matriculados: number; credenciados: number }>;
  cards: { totalTurmas: number; matriculados: number; confirmados: number; aguardandoContato: number; aguardandoResposta: number; naoResponderam: number; presentes: number; faltantes: number; represados: number; transferidos: number; cancelados: number; represadosVencendo: number; solicitacoesAbertas: number };
  taxas: { confirmacao?: string | null; comparecimentoSobreConfirmados?: string | null; comparecimentoSobreVendidos?: string | null };
  exigeAtencao: { naoResponderam: number; aguardandoContato: number; represadosVencendo: number; solicitacoesAbertas: number };
}

export interface ResultadoBuscaCredenciamento {
  matriculaId: string; pessoaId: string; pessoaNome?: string | null;
  pessoaCpf?: string | null; pessoaTelefone?: string | null;
  status: string; cursoNome?: string | null; turmaId?: string;
  turmaNome?: string | null; credenciado: boolean; credenciadoEm?: string | null; tokenQr: string;
}

export interface PedagogicoRepresado {
  id: string; pessoaNome?: string | null; pessoaCpf?: string | null;
  pessoaTelefone?: string | null; pessoaEmail?: string | null;
  cursoNome?: string | null; dataCompra?: string | null;
  validadeFim?: string | null; diasRestantes?: number | null;
  alertaVencimento: boolean; turmaNome?: string | null;
  turmaInicio?: string | null; transferencias: number; unidade?: string | null;
}

const B = '/pedagogico/v2';
const p = (o?: Record<string, string | number | undefined>) => {
  if (!o) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) { if (v != null && v !== '') sp.set(k, String(v)); }
  const s = sp.toString(); return s ? `?${s}` : '';
};

export const pedagogico = {
  dashboard: (q?: Record<string, string>) =>
    api.get<PedagogicoDashboard>(`${B}/dashboard${p(q)}`),
  represados: (q?: Record<string, string>) =>
    api.get<PedagogicoRepresado[]>(`${B}/represados${p(q)}`),
  turmas: (q?: Record<string, string | number>) =>
    api.get<{ pagina: number; total: number; itens: PedagogicoTurma[] }>(`${B}/turmas${p(q)}`),
  turma: (id: string) =>
    api.get<PedagogicoTurma & { matriculas: PedagogicoMatricula[] }>(`${B}/turmas/${id}`),
  criarTurma: (d: Record<string, unknown>) =>
    api.post<PedagogicoTurma>(`${B}/turmas`, d),
  atualizarTurma: (id: string, d: Record<string, unknown>) =>
    api.put<PedagogicoTurma>(`${B}/turmas/${id}`, d),
  mudarStatusTurma: (id: string, status: string) =>
    api.patch(`${B}/turmas/${id}/status`, { status }),
  removerTurma: (id: string) => api.delete(`${B}/turmas/${id}`),
  matriculas: (q?: Record<string, string | number>) =>
    api.get<{ pagina: number; total: number; itens: PedagogicoMatricula[] }>(`${B}/matriculas${p(q)}`),
  matricula: (id: string) => api.get(`${B}/matriculas/${id}`),
  criarMatricula: (d: Record<string, unknown>) => api.post(`${B}/matriculas`, d),
  atualizarStatus: (id: string, status: string, observacao?: string) =>
    api.patch(`${B}/matriculas/${id}/status`, { status, observacao }),
  removerMatricula: (id: string, motivo?: string) =>
    api.delete(`${B}/matriculas/${id}`, { corpo: { motivo } }),
  jornada: (pessoaId: string) => api.get(`${B}/alunos/${pessoaId}/jornada`),
  integrarVenda: (d: Record<string, unknown>) =>
    api.post(`${B}/integracoes/venda-aprovada`, d),
  buscarParaCredenciar: (q: string, turmaId?: string) =>
    api.get<ResultadoBuscaCredenciamento[]>(`${B}/credenciamento/buscar${p({ q, turmaId })}`),
  credenciar: (turmaId: string, d: Record<string, unknown>) =>
    api.post(`${B}/credenciamento/${turmaId}`, d),
  checkinQr: (d: Record<string, unknown>) => api.post(`${B}/checkin/qr`, d),
  gerarQr: (matriculaId: string) => api.get(`${B}/matriculas/${matriculaId}/qr`),
  registrarPresenca: (d: Record<string, unknown>) => api.post(`${B}/presencas`, d),
  confirmacoes: (q?: Record<string, string>) => api.get(`${B}/confirmacoes${p(q)}`),
  registrarConfirmacao: (d: Record<string, unknown>) => api.post(`${B}/confirmacoes`, d),
  atualizarConfirmacao: (id: string, status: string, resposta?: string) =>
    api.patch(`${B}/confirmacoes/${id}/status`, { status, resposta }),
  solicitarTransferencia: (d: Record<string, unknown>) => api.post(`${B}/transferencias`, d),
  efetivarTransferencia: (id: string, d: Record<string, unknown>) =>
    api.post(`${B}/transferencias/${id}/efetivar`, d),
  cancelarTransferencia: (id: string) => api.delete(`${B}/transferencias/${id}`),
  monitores: (q?: Record<string, string>) =>
    api.get<{ id: string; nome: string; email?: string | null; status: string; cursosHabilitados: string[] }[]>(`${B}/monitores${p(q)}`),
  criarMonitor: (d: Record<string, unknown>) => api.post(`${B}/monitores`, d),
  escalarMonitor: (d: Record<string, unknown>) => api.post(`${B}/monitores/escala`, d),
  marcarKitEntregue: (id: string) => api.patch(`${B}/monitores/escala/${id}/kit`, {}),
  removerMonitor: (id: string) => api.delete(`${B}/monitores/${id}`),
  removerEscala: (id: string) => api.delete(`${B}/monitores/escala/${id}`),
  solicitacoes: (q?: Record<string, string>) => api.get(`${B}/solicitacoes${p(q)}`),
  criarSolicitacao: (d: Record<string, unknown>) => api.post(`${B}/solicitacoes`, d),
  atualizarSolicitacao: (id: string, status: string, resposta?: string) =>
    api.patch(`${B}/solicitacoes/${id}/status`, { status, resposta }),
  removerSolicitacao: (id: string) => api.delete(`${B}/solicitacoes/${id}`),
  cs: (q?: Record<string, string>) => api.get(`${B}/cs${p(q)}`),
  criarCs: (d: Record<string, unknown>) => api.post(`${B}/cs`, d),
  atualizarCs: (id: string, d: Record<string, unknown>) => api.patch(`${B}/cs/${id}`, d),
  removerCs: (id: string) => api.delete(`${B}/cs/${id}`),
};
