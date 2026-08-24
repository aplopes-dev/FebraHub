export type SituacaoFornecedor = 'ativo' | 'inativo' | 'bloqueado' | 'em_homologacao';

export interface FornecedorContato {
  id?: string;
  nome: string;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  principal?: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  documento?: string | null;
  inscricao?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  categorias: string[];
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  chavePix?: string | null;
  prazoMedioDias?: number | null;
  condicoesComerciais?: string | null;
  situacao: SituacaoFornecedor;
  observacoes?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  contatos?: FornecedorContato[];
  _count?: { pedidos: number; cotacoes: number };
}

export interface FornecedorDetalhe extends Fornecedor {
  pedidos: Array<{ id: string; numero: string; valorTotal: string; previsaoEntrega?: string | null; enviadoEm?: string | null; criadoEm: string; solicitacaoId: string }>;
  cotacoes: Array<{ id: string; valorTotal: string; escolhida: boolean; criadaEm: string; solicitacaoId: string }>;
  resumo: { pedidos: number; cotacoes: number; cotacoesGanhas: number; totalComprado: number };
}

export interface FornecedorPicker {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  condicoesComerciais?: string | null;
  prazoMedioDias?: number | null;
}
