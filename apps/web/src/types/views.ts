/* ============================================================
   TIPOS DAS VIEWS

   Uma interface por view/tabela que o front lê. Os campos saem do que o JSX
   usa de fato — o que a view tem a mais não interessa aqui.

   Convenção: coluna numérica vira `number | null`. A API (NestJS) serializa
   `numeric` do Postgres como número; o front continua passando tudo por
   `Number(x ?? 0)` porque a defesa é barata e o dado vem de ETL.
   Coluna de texto opcional vira `string | null` — nunca `any`.
   ============================================================ */

/* ---------- AUTENTICAÇÃO ---------- */

export interface Usuario {
  id: string;
  email: string;
}

/** O papel/setor vem do servidor, nunca de estado local. Mesmo que alguém
 *  force `papel = admin` no React, a API continua devolvendo só o que o
 *  perfil permite. */
export interface Perfil {
  id: string;
  nome: string | null;
  setor: string | null;
  papel: string | null;
  /** Um usuário pode ter acesso a mais de um setor (perfil_setores). */
  setores: string[];
}

export interface Sessao {
  usuario: Usuario;
  perfil: Perfil | null;
}

/* ---------- COMERCIAL ---------- */

/** Uma linha por VENDA. Cobre `vw_comercial_ranking_historico`,
 *  `_geral_consolidado`, `_geral_mensal` e `_matriculas_faturamento`: as
 *  quatro alimentam os mesmos laços de KPI/pódio/evolução, com colunas
 *  ligeiramente diferentes conforme a origem. */
export interface VendaComercial {
  data?: string | null;
  /** Recorte curto (Hoje/7d) conta pela APROVAÇÃO, não pelo pagamento. */
  data_aprovacao?: string | null;
  mes?: string | null;
  categoria?: string | null;
  consultora?: string | null;
  /** Chave de agrupamento do histórico (inclui quem já saiu da empresa). */
  consultor_id_exibicao?: string | null;
  consultor_id?: string | null;
  foto_url?: string | null;
  /** false = ex-consultora. */
  atual?: boolean | null;
  valor_bruto?: number | null;
  valor?: number | null;
  /** Comprador de vaga é receita, mas não é aluno — vem com 0. */
  conta_matricula?: number | null;
}

export interface RankingGeral {
  consultor_id: string | null;
  consultora: string | null;
  foto_url: string | null;
  receita: number | null;
  vendas: number | null;
  ticket_medio: number | null;
}

export interface ComercialFunil {
  etapa?: string | null;
  quantidade?: number | null;
  valor?: number | null;
}

export interface CursoPorConsultora {
  data?: string | null;
  data_aprovacao?: string | null;
  categoria?: string | null;
  consultora?: string | null;
  curso?: string | null;
  /** Abreviação oficial do curso (cabe no tooltip). */
  curso_curto?: string | null;
  valor_bruto?: number | null;
  valor?: number | null;
}

export interface SymplaJennifer {
  consultora: string | null;
  foto_url: string | null;
  receita_liquida: number | null;
  eventos: number | null;
  ingressos: number | null;
}

export interface CarinhaGGB {
  data_pagamento?: string | null;
  data_aprovacao?: string | null;
  consultor_id?: string | null;
  consultora?: string | null;
  foto_url?: string | null;
  /** "verde" | "amarelo" | "vermelho" (minúsculo no banco). */
  carinha?: string | null;
  valor?: number | null;
}

export interface VerdeDetalhe {
  data?: string | null;
  data_aprovacao?: string | null;
  consultora?: string | null;
  cliente?: string | null;
  curso?: string | null;
  valor?: number | null;
  /** Formas de pagamento que compuseram a venda — é o que torna a
   *  classificação auditável (pedido do financeiro). */
  formas?: string | null;
  link_salesforce?: string | null;
}

/* ---------- FINANCEIRO ---------- */

export interface FinanceiroReceita {
  mes?: string | null;
  natureza?: string | null;
  curso?: string | null;
  valor?: number | null;
}

export interface FinanceiroQualidade {
  pct_sem_status?: number | null;
  pct_sem_data?: number | null;
  pct_sem_curso?: number | null;
}

export interface FinanceiroPagamentos {
  origem?: string | null;
  pagos?: number | null;
  pendentes?: number | null;
  perdidos?: number | null;
  sem_status?: number | null;
  matriculas?: number | null;
}

export interface FinanceiroCaixaHorizonte {
  horizonte?: string | null;
  a_receber?: number | null;
  parcelas?: number | null;
}

export interface FinanceiroFormaPagamento {
  forma?: string | null;
  receita?: number | null;
}

export interface FinanceiroReceitaMensal {
  mes?: string | null;
  receita?: number | null;
}

export interface FinanceiroCaixaMensal {
  mes?: string | null;
  caixa?: number | null;
}

export interface FinanceiroInadimplenciaOrigem {
  origem?: string | null;
  valor_vencido?: number | null;
}

export interface FinanceiroHorizonte {
  horizonte?: string | null;
  a_receber?: number | null;
  a_pagar?: number | null;
  parcelas?: number | null;
}

export interface FinanceiroPagoMensal {
  mes?: string | null;
  pago?: number | null;
}

/** `repasse` (migration 27) cobre coach, holding do CIS e treinadores de
 *  mentoria — não só o coach. Nome antigo era repasse_coach. */
export interface ReceitaCategoriaPeriodo {
  data?: string | null;
  categoria?: string | null;
  receita_bruta?: number | null;
  receita_unidade?: number | null;
  repasse?: number | null;
  vendas?: number | null;
}

export interface DespesaCategoriaPeriodo {
  data?: string | null;
  categoria?: string | null;
  total?: number | null;
  pago?: number | null;
}

export interface FinanceiroInadimplencia {
  categoria?: string | null;
  valor?: number | null;
}

export interface FinanceiroReceitaCategoriaTotal {
  categoria?: string | null;
  receita_bruta?: number | null;
  receita_unidade?: number | null;
}

export interface FinanceiroDespesaCategoria {
  categoria?: string | null;
  total?: number | null;
  pago?: number | null;
}

/* ---------- LOJA ---------- */

export interface LojaReceitaPeriodo {
  data?: string | null;
  forma?: string | null;
  valor?: number | null;
}

export interface LojaProdutoVendidoMes {
  mes?: string | null;
  produto_id?: string | number | null;
  produto?: string | null;
  quantidade?: number | null;
  faturamento?: number | null;
}

export interface LojaEstoque {
  produto_id?: string | number | null;
  produto?: string | null;
  valor_custo?: number | null;
  valor_venda?: number | null;
  /** Saldo zero e sem estoque mínimo cadastrado: limpeza de cadastro, não
   *  reposição. */
  sem_movimento?: boolean | null;
}

export interface LojaPerformanceCurso {
  mes_ref?: string | null;
  curso?: string | null;
  alunos?: number | null;
  faturamento?: number | null;
  turmas?: number | null;
  por_aluno?: number | null;
}

/** Metas do mês + nível atingido sobre o consolidado. */
export interface LojaMetaMes {
  mes?: string | null;
  ano?: number | null;
  receita?: number | null;
  vendas?: number | null;
  ticket_medio?: number | null;
  meta_minima?: number | null;
  meta_basica?: number | null;
  meta_master?: number | null;
  nivel_atingido?: string | null;
  em_curso?: boolean | null;
  /** Na série longa: de onde veio o número naquele mês (planilha × consolidado). */
  fonte?: string | null;
}

export interface LojaReceitaConsolidada {
  mes?: string | null;
  fonte?: string | null;
  valor?: number | null;
}

export interface LojaKpiAno {
  /** `null` = linha do acumulado geral (todos os anos). */
  ano?: number | null;
  receita?: number | null;
}

export interface LojaKpiPeriodo {
  /** 'hoje' | '7dias' | '30dias' */
  periodo?: string | null;
  vendas?: number | null;
  receita?: number | null;
  ticket_medio?: number | null;
}

/* ---------- MARKETING ---------- */

export interface MarketingResumoMensal {
  mes?: string | null;
  investimento?: number | null;
  leads?: number | null;
  gasto_captacao?: number | null;
  leads_captacao?: number | null;
}

export interface MarketingDesempenho {
  mes?: string | null;
  campanha_nome?: string | null;
  categoria?: string | null;
  produto?: string | null;
  tipo?: string | null;
  gasto?: number | null;
  leads?: number | null;
}

export interface MarketingOrigemVenda {
  mes?: string | null;
  canal?: string | null;
  vendas?: number | null;
  valor?: number | null;
}

export interface MarketingAtribuicao {
  mes?: string | null;
  categoria?: string | null;
  nome_campanha?: string | null;
  vendas_atribuidas?: number | null;
  faturamento_atribuido?: number | null;
}

/* ---------- PEDAGÓGICO ---------- */

export interface PedagogicoKpis {
  alunos_unicos?: number | null;
  matriculas?: number | null;
  cursos_por_aluno?: number | null;
  taxa_recompra?: number | null;
}

export interface PedagogicoPresencaKpis {
  taxa_comparecimento_geral?: number | null;
  turmas_cobertas?: number | null;
  turmas_totais?: number | null;
}

export interface PedagogicoPresencaTempo {
  periodo?: string | null;
  taxa_comparecimento?: number | null;
  /** Tamanho da amostra: trimestre com <30 sai de-enfatizado. */
  matriculas?: number | null;
}

export interface PedagogicoRecompraCurso {
  curso?: string | null;
  taxa_recompra?: number | null;
  alunos?: number | null;
}

export interface PedagogicoPresencaCurso {
  curso?: string | null;
  taxa_comparecimento?: number | null;
  matriculas?: number | null;
}

/** Clientes VIP (compraram MAESTRIA). Expõe PII — exceção justificada,
 *  restrita ao setor pedagógico pelo recorte da API. */
export interface Maestro {
  cpf?: string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  como_gosta_ser_chamado?: string | null;
  empresa?: string | null;
  faturamento?: number | null;
  observacoes?: string | null;
  total_investido?: number | null;
  total_cursos?: number | null;
  taxa_presenca?: number | null;
  ativo?: boolean | null;
  /** "Válido" | "Perto de vencer" | "Vencido" */
  status_maestria?: string | null;
  vence_em?: string | null;
}

export interface MaestrosKpis {
  total?: number | null;
  validos?: number | null;
  perto_vencer?: number | null;
  vencidos?: number | null;
}

export interface MaestroAnotacao {
  aluno_id?: string | null;
  como_gosta_ser_chamado?: string | null;
  empresa?: string | null;
  faturamento?: number | null;
  cargo?: string | null;
  observacoes?: string | null;
}

export interface PedagogicoAvaliacao {
  /** 'ggb' | 'evento' */
  fonte?: string | null;
  curso?: string | null;
  treinador?: string | null;
  respondentes?: number | null;
  media_indicacao?: number | null;
  media_nota_treinador?: number | null;
  media_qualidade?: number | null;
}

export interface PedagogicoAvaliacaoKpis {
  fonte?: string | null;
  cursos?: number | null;
  respondentes?: number | null;
  media_indicacao?: number | null;
}

export interface CasoRetencao {
  id?: number | null;
  nome_cliente?: string | null;
  curso?: string | null;
  motivo_cancelamento?: string | null;
  data_ligacao?: string | null;
  /** 'pendente' | 'retido' | 'cancelado' */
  desfecho?: string | null;
  observacoes?: string | null;
}

export interface PedagogicoRetencao {
  total_casos?: number | null;
  retidos?: number | null;
  cancelados?: number | null;
  taxa_retencao?: number | null;
}

export interface PedagogicoRetencaoMotivo {
  motivo?: string | null;
  retidos?: number | null;
  cancelados?: number | null;
}

/** Uma linha por turma futura, com os contadores do fluxo e a `pendencia`
 *  pronta (a view já decide o que a operadora precisa fazer). */
export interface TurmaPainel {
  turma_id: string;
  curso?: string | null;
  data_inicio?: string | null;
  dias_para_inicio?: number | null;
  matriculados?: number | null;
  confirmacao_enviada?: number | null;
  confirmaram?: number | null;
  aguardando_link_grupo?: number | null;
  grupo_criado?: boolean | null;
  pendencia?: string | null;
}

export interface PedagogicoAusente {
  aluno_id?: string | number | null;
  curso?: string | null;
  turma?: string | null;
  valor?: number | null;
}

/* ---------- EVENTOS ---------- */

export interface EventoDesempenho {
  nome_evento?: string | null;
  ingressos?: number | null;
  compareceram?: number | null;
  receita_bruta?: number | null;
  receita_liquida?: number | null;
}

/* ---------- DIRETORIA ---------- */

export interface DiretoriaConsolidado {
  mes?: string | null;
  /** 'cursos' | 'eventos' — NUNCA somados num total único. */
  unidade_negocio?: string | null;
  receita_bruta?: number | null;
  receita_liquida?: number | null;
}

/* ---------- INTEGRAÇÕES ---------- */

export interface IntegracaoStatus {
  fonte: string;
  nome_exibicao?: string | null;
  /** Já vem formatado: "Atualizado hoje", "Nunca sincronizado", etc. */
  rotulo?: string | null;
  /** 'hoje' | 'ontem' | 'ha_dias' | 'nunca' */
  frescor?: string | null;
  /** 'ok' | 'erro' | 'parcial' */
  status?: string | null;
  ultima_sync?: string | null;
  /** Marcado pelo front quando a fonte pedida não existe na view. */
  ausente?: boolean;
}

/* ---------- ESCRITA ---------- */

export interface AvaliacaoParaGravar {
  fonte: "ggb" | "evento";
  curso: string;
  treinador: string;
  data_curso?: string | null;
  turma?: string | null;
  comentario?: string | null;
  respondentes: number;
  nota_treinador?: number | null;
  q_conteudo?: number | null;
  q_clareza?: number | null;
  q_material?: number | null;
  q_aplicacao?: number | null;
  q_dominio?: number | null;
  q_pontualidade?: number | null;
  q_duvidas?: number | null;
  nps?: number | null;
}

export interface AnotacaoParaGravar {
  aluno_id: string;
  como_gosta_ser_chamado: string | null;
  empresa: string | null;
  faturamento: number | null;
  cargo: string | null;
  observacoes: string | null;
}

export interface RetencaoParaGravar {
  id?: number | null;
  nome_cliente: string;
  curso: string;
  motivo_cancelamento: string | null;
  data_ligacao: string | null;
  desfecho: string;
  observacoes: string | null;
}

/* ---------- ARQUIVOS (MinIO via API) ---------- */

export interface ArquivoMeta {
  chave: string;
  tamanho: number;
  mime: string;
  atualizadoEm: string;
  etag?: string | null;
}

export interface UrlAssinada {
  url: string;
  expiraEm: number;
}
