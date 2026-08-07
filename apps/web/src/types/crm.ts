/* Tipos do CRM — espelho de /api/crm/*. Dinheiro em CENTAVOS. */

export type EstagioCliente = "lead" | "oportunidade" | "cliente_ativo" | "inativo" | "perdido";

export const ESTAGIO_LABELS: Record<EstagioCliente, string> = {
  lead: "Lead",
  oportunidade: "Oportunidade",
  cliente_ativo: "Cliente ativo",
  inativo: "Inativo",
  perdido: "Perdido",
};

export interface CrmUsuario {
  id: string;
  nome: string;
  setor: string;
}

export interface CrmCliente {
  id: string;
  nome: string;
  tipoPessoa: "pj" | "pf";
  estagio: EstagioCliente;
  documento: string | null;
  segmento: string | null;
  origem: string | null;
  telefone: string | null;
  email: string | null;
  site: string | null;
  instagram: string | null;
  cidade: string | null;
  observacao: string | null;
  responsavelId: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CrmClienteLista extends CrmCliente {
  negocios: number;
  contatos: number;
  tarefasAbertas: number;
}

export interface CrmContato {
  id: string;
  clienteId: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  principal: boolean;
}

export interface CrmAtividade {
  id: string;
  texto: string;
  tipo?: string;
  autorId: string | null;
  criadoEm: string;
}

export interface CrmEtapa {
  id: string;
  funilId: string;
  nome: string;
  cor: string | null;
  probabilidade: number;
  tipo: "aberta" | "ganha" | "perdida";
  ordem: number;
  sistema: boolean;
}

export interface CrmFunil {
  id: string;
  nome: string;
  cor: string | null;
  status: string;
  etapas: CrmEtapa[];
}

export interface CrmNegocio {
  id: string;
  funilId: string;
  etapaId: string;
  clienteId: string;
  contatoId: string | null;
  titulo: string;
  valorCentavos: number;
  responsavelId: string | null;
  motivoPerda: string | null;
  ultimaAtividadeEm: string | null;
  fechadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  cliente?: { id: string; nome: string; estagio: EstagioCliente; telefone?: string | null; email?: string | null };
  etapa?: Pick<CrmEtapa, "id" | "nome" | "cor" | "tipo" | "ordem">;
  tarefasAbertas?: number;
}

export interface CrmNegocioDetalhe extends CrmNegocio {
  funil: CrmFunil;
  etapa: CrmEtapa;
  contato: CrmContato | null;
  atividades: CrmAtividade[];
  tarefas: CrmTarefa[];
}

export interface CrmClienteDetalhe extends CrmCliente {
  contatos: CrmContato[];
  atividades: CrmAtividade[];
  negocios: (CrmNegocio & { etapa: { nome: string; cor: string | null; tipo: string } })[];
  tarefas: CrmTarefa[];
}

export interface CrmTarefa {
  id: string;
  negocioId: string | null;
  clienteId: string | null;
  titulo: string;
  tipo: "ligacao" | "reuniao" | "follow_up";
  prioridade: "alta" | "media" | "baixa";
  venceEm: string | null;
  concluidaEm: string | null;
  resultado: string | null;
  responsavelId: string | null;
  criadoEm: string;
  negocio?: { id: string; titulo: string } | null;
  cliente?: { id: string; nome: string } | null;
}

export interface CrmResumo {
  clientesPorEstagio: { estagio: EstagioCliente; total: number }[];
  funis: {
    id: string;
    nome: string;
    etapas: (Pick<CrmEtapa, "id" | "nome" | "cor" | "tipo" | "probabilidade" | "ordem"> & {
      abertos: number;
      valorCentavos: number;
    })[];
  }[];
  tarefasAbertas: number;
  tarefasAtrasadas: number;
  ganhosNoMes: { total: number; valorCentavos: number };
}
