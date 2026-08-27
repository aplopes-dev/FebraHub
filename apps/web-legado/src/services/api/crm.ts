/* Chamadas do CRM — /api/crm/* (setor crm). */

import { api } from "./client";
import type {
  CrmCliente,
  CrmClienteDetalhe,
  CrmClienteLista,
  CrmContato,
  CrmFunil,
  CrmNegocio,
  CrmNegocioDetalhe,
  CrmResumo,
  CrmTarefa,
  CrmUsuario,
} from "@/types/crm";

export const crmResumo = (): Promise<CrmResumo> => api.get("/crm/resumo");
export const crmUsuarios = (): Promise<CrmUsuario[]> => api.get("/crm/usuarios");
export const crmFunis = (): Promise<CrmFunil[]> => api.get("/crm/funis");

export const crmCriarFunil = (dado: { nome: string; cor?: string }): Promise<CrmFunil> => api.post("/crm/funis", dado);
export const crmAtualizarFunil = (id: string, dado: { nome?: string; cor?: string }): Promise<CrmFunil> => api.patch(`/crm/funis/${id}`, dado);
export const crmRemoverFunil = (id: string): Promise<void> => api.delete(`/crm/funis/${id}`);
export const crmCriarEtapa = (funilId: string, dado: { nome: string; cor?: string; probabilidade?: number }): Promise<unknown> => api.post(`/crm/funis/${funilId}/etapas`, dado);
export const crmAtualizarEtapa = (id: string, dado: { nome?: string; cor?: string; probabilidade?: number; ordem?: number }): Promise<unknown> => api.patch(`/crm/etapas/${id}`, dado);
export const crmRemoverEtapa = (id: string): Promise<void> => api.delete(`/crm/etapas/${id}`);

export const crmClientes = (args: {
  estagio?: string;
  busca?: string;
  pagina: number;
  porPagina?: number;
}): Promise<{ itens: CrmClienteLista[]; total: number; pagina: number; porPagina: number }> =>
  api.get("/crm/clientes", { parametros: { ...args } });

export const crmCliente = (id: string): Promise<CrmClienteDetalhe> => api.get(`/crm/clientes/${id}`);

export const crmCriarCliente = (dado: Partial<CrmCliente> & { nome: string }): Promise<CrmCliente> =>
  api.post("/crm/clientes", dado);

export const crmAtualizarCliente = (id: string, dado: Partial<CrmCliente>): Promise<CrmCliente> =>
  api.patch(`/crm/clientes/${id}`, dado);

export const crmRemoverCliente = (id: string): Promise<void> => api.delete(`/crm/clientes/${id}`);

export const crmCriarContato = (clienteId: string, dado: Partial<CrmContato> & { nome: string }): Promise<CrmContato> =>
  api.post(`/crm/clientes/${clienteId}/contatos`, dado);

export const crmRemoverContato = (clienteId: string, contatoId: string): Promise<void> =>
  api.delete(`/crm/clientes/${clienteId}/contatos/${contatoId}`);

export const crmCriarAtividadeCliente = (clienteId: string, texto: string): Promise<unknown> =>
  api.post(`/crm/clientes/${clienteId}/atividades`, { texto });

export const crmNegocios = (args: { funilId?: string; clienteId?: string; abertos?: boolean }): Promise<CrmNegocio[]> =>
  api.get("/crm/negocios", {
    parametros: { funilId: args.funilId, clienteId: args.clienteId, abertos: args.abertos ? "1" : undefined },
  });

export const crmNegocio = (id: string): Promise<CrmNegocioDetalhe> => api.get(`/crm/negocios/${id}`);

export const crmCriarNegocio = (dado: {
  titulo: string;
  clienteId: string;
  valorCentavos?: number;
  responsavelId?: string;
  etapaId?: string;
}): Promise<CrmNegocio> => api.post("/crm/negocios", dado);

export const crmAtualizarNegocio = (
  id: string,
  dado: { titulo?: string; valorCentavos?: number; responsavelId?: string }
): Promise<CrmNegocio> => api.patch(`/crm/negocios/${id}`, dado);

export const crmMoverNegocio = (id: string, etapaId: string, motivoPerda?: string): Promise<CrmNegocio> =>
  api.post(`/crm/negocios/${id}/mover`, { etapaId, motivoPerda });

export const crmRemoverNegocio = (id: string): Promise<void> => api.delete(`/crm/negocios/${id}`);

export const crmCriarAtividadeNegocio = (id: string, texto: string, tipo = "nota"): Promise<unknown> =>
  api.post(`/crm/negocios/${id}/atividades`, { texto, tipo });

export const crmTarefas = (args: { abertas?: boolean }): Promise<CrmTarefa[]> =>
  api.get("/crm/tarefas", { parametros: { abertas: args.abertas === undefined ? undefined : args.abertas ? "1" : "0" } });

export const crmCriarTarefa = (dado: {
  titulo: string;
  tipo?: string;
  prioridade?: string;
  venceEm?: string;
  negocioId?: string;
  clienteId?: string;
}): Promise<CrmTarefa> => api.post("/crm/tarefas", dado);

export const crmConcluirTarefa = (id: string, resultado?: string): Promise<CrmTarefa> =>
  api.post(`/crm/tarefas/${id}/concluir`, { resultado });

export const crmReabrirTarefa = (id: string): Promise<CrmTarefa> => api.post(`/crm/tarefas/${id}/reabrir`);

export const crmAtualizarTarefa = (
  id: string,
  dado: { titulo?: string; tipo?: string; prioridade?: string; venceEm?: string | null; responsavelId?: string },
): Promise<CrmTarefa> => api.patch(`/crm/tarefas/${id}`, dado);

export const crmRemoverTarefa = (id: string): Promise<void> => api.delete(`/crm/tarefas/${id}`);
