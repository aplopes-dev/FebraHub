import { api } from "./client";
import type {
  CarinhaGGB, ComercialFunil, CursoPorConsultora, DespesaCategoriaPeriodo,
  DiretoriaConsolidado, EventoDesempenho, FinanceiroCaixaHorizonte, FinanceiroCaixaMensal,
  FinanceiroDespesaCategoria, FinanceiroFormaPagamento, FinanceiroHorizonte,
  FinanceiroInadimplencia, FinanceiroInadimplenciaOrigem, FinanceiroPagamentos,
  FinanceiroPagoMensal, FinanceiroQualidade, FinanceiroReceita,
  FinanceiroReceitaCategoriaTotal, FinanceiroReceitaMensal, IntegracaoStatus,
  LojaEstoque, LojaKpiAno, LojaKpiPeriodo, LojaMetaMes, LojaPerformanceCurso,
  LojaProdutoVendidoMes, LojaReceitaConsolidada, LojaReceitaPeriodo, Maestro,
  MaestroAnotacao, MaestrosKpis, MarketingAtribuicao, MarketingDesempenho,
  MarketingOrigemVenda, MarketingResumoMensal, PedagogicoAusente, PedagogicoAvaliacao,
  PedagogicoAvaliacaoKpis, PedagogicoKpis, PedagogicoPresencaCurso,
  PedagogicoPresencaKpis, PedagogicoPresencaTempo, PedagogicoRecompraCurso,
  PedagogicoRetencao, PedagogicoRetencaoMotivo, RankingGeral, CasoRetencao,
  ReceitaCategoriaPeriodo, SymplaJennifer, TurmaPainel, VendaComercial, VerdeDetalhe,
} from "@/types/views";

/* ============================================================
   VIEWS — o front NUNCA toca em tabela crua.
   A API expõe uma rota de leitura por view (`GET /dados/<view>`); quem não
   tem o setor recebe 403, do mesmo jeito que a RLS negava antes.

   PAGINAÇÃO: sumiu, e isso é a correção de um bug conhecido do projeto. No
   Supabase o PostgREST cortava a resposta no "Max rows" do projeto (padrão
   1000) — silenciosamente, sem erro. As views com dimensão de data devolvem
   uma linha por (chave, dia) e passam MUITO disso: sem paginar, o front
   recebia um pedaço arbitrário e categorias inteiras sumiam do mês. O
   `buscarTudo` existia só pra dar a volta nisso, buscando página a página e
   conferindo com o count exato.

   A API própria devolve TODAS as linhas da view numa resposta só, então o
   `buscarTudo` deixou de existir. Duas consequências práticas:
   1) o parâmetro `ordem` de cada hook também sumiu — ele existia porque
      paginar sem ORDER BY estável deixa o Postgres livre pra repetir/pular
      linhas entre páginas. Sem paginação, não há o que estabilizar;
   2) se um dia a API voltar a paginar, é AQUI que a paginação tem que
      voltar — não em cada hook. E com ORDER BY estável.
   ============================================================ */

/** Nome exato da view/tabela no caminho: `vw_comercial_funil` continua sendo
 *  `vw_comercial_funil` na URL. Sem tradução de nomes, o mapa view↔rota é
 *  óbvio e um `grep` acha os dois lados. */
export const buscarView = <T>(nome: string): Promise<T[]> => api.get<T[]>(`/dados/${nome}`);

/* ---------- COMERCIAL ---------- */

export const comercialFunil = () => buscarView<ComercialFunil>("vw_comercial_funil");

/* Pódio, duas fontes. `_geral` é o hall da fama (já agregado, todos os
   tempos, ignora o filtro). `_periodo` é uma linha por venda: o front
   recorta por `data` e reagrupa, então a ordem muda com o período. */
export const comercialRankingGeral = () => buscarView<RankingGeral>("vw_comercial_ranking_geral");
export const comercialRankingPeriodo = () => buscarView<VendaComercial>("vw_comercial_ranking_periodo");

/* Ranking por categoria: uma linha por venda, com `categoria` e `data`.
   Alimenta KPIs, YoY, evolução mensal e o pódio da categoria selecionada.
   A view já aplica o split 50/50 do CI e a data de largada de cada
   consultora — o front não recalcula nada disso. */
export const comercialRankingCategoria = () => buscarView<VendaComercial>("vw_comercial_ranking_categoria");

/* Ranking histórico: uma linha por venda, incluindo quem já saiu da empresa
   (`atual` = false). É a fonte do faturamento REAL de qualquer período —
   2022 aparece com quem vendeu na época, não zerado por falta de
   consultora atual. `consultor_id_exibicao` é a chave de agrupamento. */
export const comercialRankingHistorico = () => buscarView<VendaComercial>("vw_comercial_ranking_historico");

/* Uma linha por matrícula: o front conta (volume) e soma (faturamento)
   por mês, pra cruzar as duas séries no mesmo gráfico. */
export const comercialMatriculasFaturamento = () =>
  buscarView<VendaComercial>("vw_comercial_matriculas_faturamento");

/* Cursos vendidos por consultora — alimenta o tooltip do ranking. */
export const comercialCursosPorConsultora = () =>
  buscarView<CursoPorConsultora>("vw_comercial_cursos_por_consultora");

/* "Geral": consolidado das 3 formações (GGB + CI + CIS). Sympla fica de
   fora — evento é outra unidade. As views já aplicam o split 50/50 do CI e
   o tratamento do Danilo; o front só soma. */
export const comercialRankingGeralConsolidado = () =>
  buscarView<VendaComercial>("vw_comercial_ranking_geral_consolidado");
export const comercialGeralMensal = () => buscarView<VendaComercial>("vw_comercial_geral_mensal");

/* Sympla: já agregado e sem dimensão de data — só a Jennifer, porque o
   dado do Sympla não tem vínculo de consultora. */
export const comercialSymplaJennifer = () => buscarView<SymplaJennifer>("vw_comercial_sympla_jennifer");

/* Placar da gamificação: uma linha por VENDA (time GGB, desde jan/2025).
   O front recorta por data_pagamento e conta as cores no período. */
export const comercialCarinhas = () => buscarView<CarinhaGGB>("vw_comercial_carinhas_ggb");

/* Detalhe das vendas verdes (auditoria da classificação). Uma linha por
   venda; a coluna `formas` mostra as formas de pagamento que a compuseram. */
export const comercialVerdesDetalhe = () => buscarView<VerdeDetalhe>("vw_comercial_verdes_detalhe");

/* ---------- FINANCEIRO ---------- */

export const financeiroReceita = () => buscarView<FinanceiroReceita>("vw_financeiro_receita");
export const financeiroInadimp = () => buscarView<FinanceiroInadimplencia>("vw_financeiro_inadimplencia");
export const financeiroQualid = () => buscarView<FinanceiroQualidade>("vw_financeiro_qualidade");
export const financeiroPagamentos = () => buscarView<FinanceiroPagamentos>("vw_financeiro_pagamentos");
export const financeiroReceitaCategoria = () =>
  buscarView<FinanceiroReceitaCategoriaTotal>("vw_financeiro_receita_categoria_total");
export const financeiroCaixaHorizonte = () =>
  buscarView<FinanceiroCaixaHorizonte>("vw_financeiro_caixa_horizonte");
export const financeiroFormasPagamento = () =>
  buscarView<FinanceiroFormaPagamento>("vw_financeiro_formas_pagamento");

// Views que a Dulce vai criar (evolução mensal + caixa CisPay). Enquanto
// não existirem, a leitura devolve [] e o card mostra estado vazio honesto.
export const financeiroReceitaMensal = () =>
  buscarView<FinanceiroReceitaMensal>("vw_financeiro_receita_mensal");
export const financeiroCaixaMensal = () => buscarView<FinanceiroCaixaMensal>("vw_financeiro_caixa_mensal");

/* Conta Azul: inadimplência, a receber e despesa. NUNCA somar com a
   receita (Salesforce) — são fontes e unidades diferentes. */
export const financeiroInadimpOrigem = () =>
  buscarView<FinanceiroInadimplenciaOrigem>("vw_financeiro_inadimplencia_origem");
export const financeiroAReceberHorizonte = () =>
  buscarView<FinanceiroHorizonte>("vw_financeiro_a_receber_horizonte");
export const financeiroDespesaCategoria = () =>
  buscarView<FinanceiroDespesaCategoria>("vw_financeiro_despesa_categoria");
export const financeiroAPagarHorizonte = () =>
  buscarView<FinanceiroHorizonte>("vw_financeiro_a_pagar_horizonte");
export const financeiroPagoMensal = () => buscarView<FinanceiroPagoMensal>("vw_financeiro_pago_mensal");

/* Views com dimensão de data. Entregam as linhas com `data`; o front
   recorta pelo período e reagrega. Só métricas de FLUXO — estado
   (inadimplência, horizontes) é snapshot e não tem recorte. */
export const financeiroReceitaCategoriaPeriodo = () =>
  buscarView<ReceitaCategoriaPeriodo>("vw_financeiro_receita_categoria_periodo");
export const financeiroDespesaCategoriaPeriodo = () =>
  buscarView<DespesaCategoriaPeriodo>("vw_financeiro_despesa_categoria_periodo");

/* ---------- LOJA ---------- */
/* Loja — receita própria. Curso ≠ loja: nunca entra num total conjunto.
   A receita é CONSOLIDADA (ver lojaReceitaTotalMes); os hooks antigos de
   KPI Omie-só / meta separada saíram junto com a mudança. */

export const lojaReceitaPeriodo = () => buscarView<LojaReceitaPeriodo>("vw_loja_receita_periodo");

/* Operacional da loja — vem do Omie (PDV). Produto vendido e saldo de
   prateleira. Uma linha por (produto, mês): o front soma os meses do
   período e ranqueia. */
export const lojaProdutosVendidosMes = () =>
  buscarView<LojaProdutoVendidoMes>("vw_loja_produtos_vendidos_mes");
// Posição de estoque (snapshot do dia): 443 produtos, ignora o período.
export const lojaEstoque = () => buscarView<LojaEstoque>("vw_loja_estoque");

/* Performance por curso: quanto a loja vende DURANTE cada curso (planilha da
   gestora). Uma linha por (curso, mês). É o mesmo dinheiro da receita, visto
   por curso — NÃO somar com o total. O front recorta por mes_ref e reagrega
   por curso. `por_aluno` é recalculado após a soma (média de médias mente). */
export const lojaPerformanceCurso = () => buscarView<LojaPerformanceCurso>("vw_loja_performance_curso");

/* Receita CONSOLIDADA por mês — soma todas as fontes (produtos/Omie + livrão,
   cursos premium, aluguel de sala, Sentido de Brincar). É a fonte oficial da
   receita da loja agora, com a meta recalculada sobre o total. */
export const lojaReceitaTotalMes = () => buscarView<LojaMetaMes>("vw_loja_receita_total_mes");

/* Quebra da receita por FONTE (Produtos, Livrão, Cursos premium, Aluguel de
   sala, Sentido de Brincar). Produtos é ~91%; as outras são complementos. */
export const lojaReceitaConsolidada = () => buscarView<LojaReceitaConsolidada>("vw_loja_receita_consolidada");

/* Série mensal LONGA da receita (2022 a 2026) — a fonte muda ao longo dela:
   2022-2024 vêm da planilha de fechamento da gestora, 2025+ do consolidado
   (Omie + livrão, cursos premium, aluguel de sala, Sentido de Brincar). O
   campo `fonte` diz qual em cada mês; a transição é marcada no gráfico
   (tracejado até 2024, sólido de 2025) porque a queda entre os dois reflete
   a troca de fonte, não o negócio. Traz também a meta do mês (planilha, cobre
   2022-2026) e o nível. Meses não preenchidos (ex.: abr/2023) simplesmente
   não vêm — o gráfico pula, não desenha zero. */
export const lojaSerie = () => buscarView<LojaMetaMes>("vw_loja_serie");

/* Receita por ANO (uma linha por ano + uma com ano = null = acumulado geral).
   Alimenta a lista de anos do seletor (2022-2026) e o número de receita nos
   modos Ano e "Geral". Só receita — vendas/ticket não existem pra 2022-2024. */
export const lojaKpisAno = () => buscarView<LojaKpiAno>("vw_loja_kpis_ano");

/* KPIs por RECORTE CURTO já prontos: uma linha por período — periodo = 'hoje',
   '7dias' ou '30dias' (vendas, receita, ticket_medio). Cobre SÓ produtos
   (PDV/Omie), a única fonte com data exata de venda; livrão, cursos premium e
   aluguel são mensais e não entram no recorte diário. */
export const lojaKpisPeriodo = () => buscarView<LojaKpiPeriodo>("vw_loja_kpis_periodo");

/* ---------- MARKETING ----------
   Meta Ads entrega gasto/impressão/lead por anúncio, agregado por MÊS —
   não existe linha diária, e por isso o hub não tem recorte de 7 dias.

   O que NÃO existe ainda: atribuição de venda a campanha. Nenhuma das
   views abaixo tem coluna de venda, receita ou ROI — conferido por probe
   (42703). O front marca esses campos como "em construção" e nunca
   estima: dividir faturamento por investimento sem atribuição daria um
   ROI inventado. */

export const marketingResumoMensal = () => buscarView<MarketingResumoMensal>("vw_marketing_resumo_mensal");

/* Uma linha por (mês, campanha). Reconcilia EXATAMENTE com a resumo_mensal
   (investimento = Σ gasto; cpl_medio = Σ gasto_captação / Σ leads_captação),
   então é ela que sustenta o filtro por produto sem divergir dos KPIs. */
export const marketingDesempenho = () => buscarView<MarketingDesempenho>("vw_marketing_desempenho");

/* Origem das vendas por canal — cobertura começa em jun/2026 e cresce a
   cada mês; a maioria das vendas ainda cai em "Pedido". */
export const marketingOrigemVendas = () => buscarView<MarketingOrigemVenda>("vw_marketing_origem_vendas");

/* Atribuição: vendas cujo comprador foi lead de anúncio ANTES da compra.
   É um PISO comprovável (~7% das vendas), não o faturamento do digital.
   Vive à parte de propósito — dividir isto pelo investimento (que é cheio)
   daria um ROI falso, comparando um parcial com um total.

   A view é pesada o bastante pra estourar o statement timeout na primeira
   execução fria — o retry do client (e o do QueryClient) pega a segunda,
   já com o plano quente. */
export const marketingAtribuicao = () => buscarView<MarketingAtribuicao>("vw_marketing_atribuicao_campanha");

/* ---------- PEDAGÓGICO / SUCESSO DO CLIENTE ----------
   Foco em SAÚDE (acompanhamento), não lista de tarefas. Tudo vem do
   Salesforce. Conclusão, notas e NPS não são medidos — não existem na fonte.
   Presença cobre só as turmas com credenciamento confiável (176 de 197). */

// KPIs de recompra (fidelização): uma linha agregada — alunos únicos,
// matrículas, cursos por aluno, taxa de recompra.
export const pedagogicoKpis = () => buscarView<PedagogicoKpis>("vw_pedagogico_kpis");
// KPIs de presença: comparecimento geral + cobertura (turmas credenciadas).
export const pedagogicoPresencaKpis = () => buscarView<PedagogicoPresencaKpis>("vw_pedagogico_presenca_kpis");
// Taxa de comparecimento por TRIMESTRE (série). `matriculas` é o tamanho da
// amostra — o front de-enfatiza trimestres com poucas (<~30) matrículas.
export const pedagogicoPresencaTempo = () =>
  buscarView<PedagogicoPresencaTempo>("vw_pedagogico_presenca_tempo");
// Cursos que mais fidelizam (taxa_recompra por curso). `alunos` = amostra.
export const pedagogicoRecompraCurso = () =>
  buscarView<PedagogicoRecompraCurso>("vw_pedagogico_recompra_curso");
// Cursos com mais falta (taxa_comparecimento por curso; piores no topo no front).
export const pedagogicoPresencaCurso = () =>
  buscarView<PedagogicoPresencaCurso>("vw_pedagogico_presenca_curso");
// Painel de Maestros: os clientes VIP (compraram MAESTRIA). `_completo` já
// junta as anotações editáveis (apelido/empresa/faturamento/observacoes) aos
// campos do maestro; a chave é `cpf` (= aluno_id em maestro_anotacao). PII
// restrita ao setor. O front reordena por investido.
export const pedagogicoMaestrosCompleto = () => buscarView<Maestro>("vw_pedagogico_maestros_completo");
// KPIs do grupo de maestros: total + contadores de validade da Maestria
// (validos, perto_vencer, vencidos). Validade = 12 meses desde a compra da
// MAESTRIA; "vencido" é benefício expirado (oportunidade de renovação), não
// deixou de ser maestro. Uma linha só.
export const pedagogicoMaestrosKpis = () => buscarView<MaestrosKpis>("vw_pedagogico_maestros_kpis");
// Anotações cruas (maestro_anotacao) — a view _completo não expõe `cargo`, e
// o form de edição pré-preenche esse campo. Acesso restrito ao pedagógico.
export const pedagogicoMaestroAnotacoes = () => buscarView<MaestroAnotacao>("maestro_anotacao");
// Avaliações (GGB + eventos): uma linha por curso/evento com as médias já
// calculadas — media_indicacao (alunos), media_nota_treinador (só GGB) e
// media_qualidade. Os KPIs trazem contagens por fonte.
export const pedagogicoAvaliacao = () => buscarView<PedagogicoAvaliacao>("vw_pedagogico_avaliacao");
export const pedagogicoAvaliacaoKpis = () =>
  buscarView<PedagogicoAvaliacaoKpis>("vw_pedagogico_avaliacao_kpis");
// Retenção (entrada manual): casos crus (fato_retencao), o resumo
// (vw_pedagogico_retencao: total_casos/retidos/cancelados/taxa) e os motivos
// (vw_pedagogico_retencao_motivos: motivo, retidos vs cancelados).
export const pedagogicoRetencaoCasos = () => buscarView<CasoRetencao>("fato_retencao");
export const pedagogicoRetencao = () => buscarView<PedagogicoRetencao>("vw_pedagogico_retencao");
export const pedagogicoRetencaoMotivos = () =>
  buscarView<PedagogicoRetencaoMotivo>("vw_pedagogico_retencao_motivos");

/* AUTOMAÇÃO DE CONFIRMAÇÕES (operacional — staleTime 60s no hook). O painel
   traz uma linha por turma futura com os contadores do fluxo e a `pendencia`
   pronta. */
export const pedagogicoPainel = () => buscarView<TurmaPainel>("vw_pedagogico_painel");
// Lista de reativação (secundária): aluno_id, curso, turma, valor.
export const pedagogicoAusentes = () => buscarView<PedagogicoAusente>("vw_pedagogico_ausentes");

/* ---------- EVENTOS / DIRETORIA / INTEGRAÇÕES ---------- */

export const eventosDesempenho = () => buscarView<EventoDesempenho>("vw_eventos_desempenho");
export const diretoriaConsol = () => buscarView<DiretoriaConsolidado>("vw_diretoria_consolidado");

/* Status de atualização das integrações — uma linha por fonte. O `rotulo`
   já vem formatado ("Atualizado hoje", "Nunca sincronizado", etc.). */
export const integracaoStatus = () => buscarView<IntegracaoStatus>("vw_integracao_status");
