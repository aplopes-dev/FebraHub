/**
 * Catálogo das views que o frontend pode ler, e de quem pode lê-las.
 *
 * Este arquivo é a fronteira de segurança do lado dos dados. No Supabase, cada
 * view carregava `where public.pode_ver('<setor>')` e uma view sem esse WHERE
 * era um buraco — a view roda com privilégio do dono e ignora a RLS das
 * tabelas de baixo. Aqui a regra saiu do SQL e virou dado: o nome da view só
 * é aceito se estiver nesta lista, e o setor exigido vem daqui.
 *
 * Consequências práticas:
 *   - nome de view fora do catálogo não é consultado (nada de SQL montado com
 *     string vinda do cliente);
 *   - quem não é do setor recebe 403, e não uma lista vazia que parece
 *     "sem dados neste recorte".
 */
export type Setor =
  | 'geral'
  | 'financeiro'
  | 'comercial'
  | 'marketing'
  | 'pedagogico'
  | 'loja'
  | 'eventos'
  | 'estoque';

export interface ViewCatalogada {
  /** Setor exigido. 'geral' = só admin ou perfil geral. */
  setor: Setor;
  /** Colunas de ordenação, na ordem. Espelha o `ordem` que o front pedia. */
  ordem?: string[];
  /** Descrição curta para o Swagger. */
  descricao: string;
}

export const CATALOGO: Record<string, ViewCatalogada> = {
  // ---------------- COMERCIAL ----------------
  vw_comercial_funil: { setor: 'comercial', descricao: 'Funil por etapa e status' },
  vw_comercial_ranking_geral: { setor: 'comercial', descricao: 'Pódio de todos os tempos' },
  vw_comercial_ranking_periodo: {
    setor: 'comercial',
    ordem: ['data', 'consultor_id', 'valor'],
    descricao: 'Uma linha por venda, para recortar por período',
  },
  vw_comercial_ranking_categoria: {
    setor: 'comercial',
    ordem: ['data', 'categoria', 'consultor_id', 'valor'],
    descricao: 'Vendas por categoria (já com o split 50/50 do CI aplicado)',
  },
  vw_comercial_ranking_historico: {
    setor: 'comercial',
    ordem: ['data', 'categoria', 'consultor_id_exibicao', 'valor'],
    descricao: 'Faturamento real do período, incluindo quem já saiu da empresa',
  },
  vw_comercial_matriculas_faturamento: {
    setor: 'comercial',
    ordem: ['data', 'categoria', 'valor'],
    descricao: 'Uma linha por matrícula: volume e faturamento no mesmo gráfico',
  },
  vw_comercial_cursos_por_consultora: {
    setor: 'comercial',
    ordem: ['data', 'consultora', 'curso', 'valor'],
    descricao: 'Cursos vendidos por consultora (tooltip do ranking)',
  },
  vw_comercial_ranking_geral_consolidado: {
    setor: 'comercial',
    ordem: ['data', 'consultora', 'valor'],
    descricao: 'Consolidado das 3 formações (GGB + CI + CIS)',
  },
  vw_comercial_geral_mensal: {
    setor: 'comercial',
    ordem: ['data', 'valor'],
    descricao: 'Série mensal do consolidado',
  },
  vw_comercial_sympla_jennifer: { setor: 'comercial', descricao: 'Eventos Sympla (agregado)' },
  vw_comercial_carinhas_ggb: {
    setor: 'comercial',
    ordem: ['data_pagamento', 'consultor_id', 'valor', 'carinha'],
    descricao: 'Placar da gamificação: uma linha por venda do time GGB',
  },
  vw_comercial_verdes_detalhe: {
    setor: 'comercial',
    ordem: ['data', 'consultora', 'valor'],
    descricao: 'Auditoria das vendas verdes',
  },

  // ---------------- FINANCEIRO ----------------
  vw_financeiro_receita: { setor: 'financeiro', descricao: 'Receita por mês, unidade e tipo' },
  vw_financeiro_inadimplencia: { setor: 'financeiro', descricao: 'Inadimplência por mês e status' },
  vw_financeiro_qualidade: { setor: 'financeiro', descricao: 'Cobertura do dado financeiro' },
  vw_financeiro_pagamentos: { setor: 'financeiro', descricao: 'Status dos pagamentos' },
  vw_financeiro_receita_categoria_total: {
    setor: 'financeiro',
    descricao: 'Receita por categoria, acumulada',
  },
  vw_financeiro_caixa_horizonte: {
    setor: 'financeiro',
    descricao: 'A receber de cartão por faixa de dias',
  },
  vw_financeiro_formas_pagamento: { setor: 'financeiro', descricao: 'Formas de pagamento' },
  vw_financeiro_receita_mensal: { setor: 'financeiro', descricao: 'Série mensal da receita' },
  vw_financeiro_caixa_mensal: { setor: 'financeiro', descricao: 'Série mensal do caixa CisPay' },
  vw_financeiro_inadimplencia_origem: {
    setor: 'financeiro',
    descricao: 'Inadimplência por origem (Conta Azul)',
  },
  vw_financeiro_a_receber_horizonte: {
    setor: 'financeiro',
    descricao: 'A receber por faixa de dias (Conta Azul)',
  },
  vw_financeiro_despesa_categoria: { setor: 'financeiro', descricao: 'Despesa por categoria' },
  vw_financeiro_a_pagar_horizonte: {
    setor: 'financeiro',
    descricao: 'A pagar por faixa de dias',
  },
  vw_financeiro_pago_mensal: { setor: 'financeiro', descricao: 'Série mensal do pago' },
  vw_financeiro_receita_categoria_periodo: {
    setor: 'financeiro',
    ordem: ['data', 'categoria'],
    descricao: 'Receita por categoria com dimensão de data',
  },
  vw_financeiro_despesa_categoria_periodo: {
    setor: 'financeiro',
    ordem: ['data', 'categoria'],
    descricao: 'Despesa por categoria com dimensão de data',
  },

  // ---------------- MARKETING ----------------
  vw_marketing_resumo_mensal: {
    setor: 'marketing',
    ordem: ['mes'],
    descricao: 'Investimento, leads e CPL por mês',
  },
  vw_marketing_desempenho: {
    setor: 'marketing',
    ordem: ['mes', 'campanha_nome'],
    descricao: 'Desempenho por campanha (reconcilia com o resumo mensal)',
  },
  vw_marketing_origem_vendas: {
    setor: 'marketing',
    ordem: ['mes', 'canal'],
    descricao: 'Origem das vendas por canal',
  },
  vw_marketing_atribuicao_campanha: {
    setor: 'marketing',
    descricao: 'Vendas cujo comprador foi lead de anúncio antes da compra (piso comprovável)',
  },

  // ---------------- PEDAGÓGICO ----------------
  vw_pedagogico_kpis: { setor: 'pedagogico', descricao: 'KPIs de recompra' },
  vw_pedagogico_presenca_kpis: { setor: 'pedagogico', descricao: 'KPIs de presença' },
  vw_pedagogico_presenca_tempo: {
    setor: 'pedagogico',
    ordem: ['periodo'],
    descricao: 'Comparecimento por trimestre',
  },
  vw_pedagogico_recompra_curso: {
    setor: 'pedagogico',
    ordem: ['curso'],
    descricao: 'Cursos que mais fidelizam',
  },
  vw_pedagogico_presenca_curso: {
    setor: 'pedagogico',
    ordem: ['curso'],
    descricao: 'Cursos com mais falta',
  },
  vw_pedagogico_maestros_completo: {
    setor: 'pedagogico',
    ordem: ['total_investido', 'nome'],
    descricao: 'Painel de maestros (contém PII — restrito ao setor)',
  },
  vw_pedagogico_maestros_kpis: { setor: 'pedagogico', descricao: 'KPIs de validade da Maestria' },
  vw_pedagogico_avaliacao: {
    setor: 'pedagogico',
    ordem: ['fonte', 'curso'],
    descricao: 'Avaliações GGB e de eventos',
  },
  vw_pedagogico_avaliacao_kpis: { setor: 'pedagogico', descricao: 'Contagens por fonte' },
  vw_pedagogico_retencao: { setor: 'pedagogico', descricao: 'Resumo da retenção' },
  vw_pedagogico_retencao_motivos: {
    setor: 'pedagogico',
    ordem: ['motivo'],
    descricao: 'Motivos de cancelamento',
  },
  vw_pedagogico_painel: {
    setor: 'pedagogico',
    ordem: ['data_inicio', 'turma_id'],
    descricao: 'Painel operacional de confirmações',
  },
  vw_pedagogico_ausentes: {
    setor: 'pedagogico',
    ordem: ['aluno_id', 'curso', 'turma'],
    descricao: 'Lista de reativação',
  },

  // ---------------- LOJA ----------------
  vw_loja_produtos_vendidos_mes: {
    setor: 'loja',
    ordem: ['mes', 'produto_id'],
    descricao: 'Produtos vendidos por mês',
  },
  vw_loja_estoque: { setor: 'loja', ordem: ['produto_id'], descricao: 'Posição de estoque' },
  vw_loja_performance_curso: {
    setor: 'loja',
    ordem: ['mes_ref', 'curso'],
    descricao: 'Quanto a loja vende durante cada curso',
  },
  vw_loja_receita_total_mes: {
    setor: 'loja',
    ordem: ['mes'],
    descricao: 'Receita consolidada por mês, com metas',
  },
  vw_loja_receita_consolidada: {
    setor: 'loja',
    ordem: ['mes', 'fonte'],
    descricao: 'Quebra da receita por fonte',
  },
  vw_loja_serie: {
    setor: 'loja',
    ordem: ['mes'],
    descricao: 'Série mensal longa (2022-2026); a fonte muda em 2025',
  },
  vw_loja_kpis_ano: { setor: 'loja', ordem: ['ano'], descricao: 'Receita por ano' },
  vw_loja_kpis_periodo: {
    setor: 'loja',
    ordem: ['periodo'],
    descricao: 'KPIs de hoje / 7 dias / 30 dias (só produtos do PDV)',
  },
  vw_loja_receita_periodo: {
    setor: 'loja',
    ordem: ['data', 'forma'],
    descricao: 'Receita da loja com dimensão de data',
  },

  // ---------------- EVENTOS / DIRETORIA ----------------
  vw_eventos_desempenho: { setor: 'eventos', descricao: 'Ingressos, comparecimento e receita' },
  vw_diretoria_consolidado: {
    setor: 'geral',
    descricao: 'Consolidado por unidade de negócio (só admin/geral)',
  },

  // ---------------- TABELAS LIDAS DIRETO ----------------
  // Não são views, mas o front lê como se fossem. Ficam aqui pelo mesmo
  // motivo: entrar no catálogo é o que autoriza a leitura.
  maestro_anotacao: {
    setor: 'pedagogico',
    ordem: ['aluno_id'],
    descricao: 'Anotações editáveis dos maestros',
  },
  fato_retencao: {
    setor: 'pedagogico',
    ordem: ['data_ligacao', 'id'],
    descricao: 'Casos de retenção (entrada manual)',
  },
};

/**
 * Status das integrações. Fica fora do catálogo por setor de propósito: o
 * rodapé aparece em todos os hubs, e esconder "quando a fonte atualizou" de
 * quem olha o número seria pior do que mostrar.
 */
export const VIEWS_ABERTAS = new Set(['vw_integracao_status']);

export function catalogada(nome: string): boolean {
  return nome in CATALOGO || VIEWS_ABERTAS.has(nome);
}
