"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import * as vw from "@/services/api/hubs";
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

/** Resultado de qualquer view: os hubs só usam `data`, `isLoading` e `error`. */
export type Consulta<T> = UseQueryResult<T[], Error>;

/* Uma consulta por view, chaveada pelo nome da view. Padrão 5 min; dados
   operacionais (ex.: fila de confirmação) passam staleTime menor pra
   atualizar mais rápido. */
function useView<T>(nome: string, buscar: () => Promise<T[]>, opcoes: { staleTime?: number } = {}): Consulta<T> {
  return useQuery<T[], Error>({
    queryKey: ["view", nome],
    staleTime: opcoes.staleTime ?? 5 * 60 * 1000,
    queryFn: buscar,
  });
}

/* ---------- COMERCIAL ---------- */

export const useComercialFunil = (): Consulta<ComercialFunil> =>
  useView("vw_comercial_funil", vw.comercialFunil);

export const useComercialRankingGeral = (): Consulta<RankingGeral> =>
  useView("vw_comercial_ranking_geral", vw.comercialRankingGeral);

export const useComercialRankingPeriodo = (): Consulta<VendaComercial> =>
  useView("vw_comercial_ranking_periodo", vw.comercialRankingPeriodo);

export const useComercialRankingCategoria = (): Consulta<VendaComercial> =>
  useView("vw_comercial_ranking_categoria", vw.comercialRankingCategoria);

export const useComercialRankingHistorico = (): Consulta<VendaComercial> =>
  useView("vw_comercial_ranking_historico", vw.comercialRankingHistorico);

export const useComercialMatriculasFaturamento = (): Consulta<VendaComercial> =>
  useView("vw_comercial_matriculas_faturamento", vw.comercialMatriculasFaturamento);

export const useComercialCursosPorConsultora = (): Consulta<CursoPorConsultora> =>
  useView("vw_comercial_cursos_por_consultora", vw.comercialCursosPorConsultora);

export const useComercialRankingGeralConsolidado = (): Consulta<VendaComercial> =>
  useView("vw_comercial_ranking_geral_consolidado", vw.comercialRankingGeralConsolidado);

export const useComercialGeralMensal = (): Consulta<VendaComercial> =>
  useView("vw_comercial_geral_mensal", vw.comercialGeralMensal);

export const useComercialSymplaJennifer = (): Consulta<SymplaJennifer> =>
  useView("vw_comercial_sympla_jennifer", vw.comercialSymplaJennifer);

export const useComercialCarinhas = (): Consulta<CarinhaGGB> =>
  useView("vw_comercial_carinhas_ggb", vw.comercialCarinhas);

export const useComercialVerdesDetalhe = (): Consulta<VerdeDetalhe> =>
  useView("vw_comercial_verdes_detalhe", vw.comercialVerdesDetalhe);

/* ---------- FINANCEIRO ---------- */

export const useFinanceiroReceita = (): Consulta<FinanceiroReceita> =>
  useView("vw_financeiro_receita", vw.financeiroReceita);

export const useFinanceiroInadimp = (): Consulta<FinanceiroInadimplencia> =>
  useView("vw_financeiro_inadimplencia", vw.financeiroInadimp);

export const useFinanceiroQualid = (): Consulta<FinanceiroQualidade> =>
  useView("vw_financeiro_qualidade", vw.financeiroQualid);

export const useFinanceiroPagamentos = (): Consulta<FinanceiroPagamentos> =>
  useView("vw_financeiro_pagamentos", vw.financeiroPagamentos);

export const useFinanceiroReceitaCategoria = (): Consulta<FinanceiroReceitaCategoriaTotal> =>
  useView("vw_financeiro_receita_categoria_total", vw.financeiroReceitaCategoria);

export const useFinanceiroCaixaHorizonte = (): Consulta<FinanceiroCaixaHorizonte> =>
  useView("vw_financeiro_caixa_horizonte", vw.financeiroCaixaHorizonte);

export const useFinanceiroFormasPagamento = (): Consulta<FinanceiroFormaPagamento> =>
  useView("vw_financeiro_formas_pagamento", vw.financeiroFormasPagamento);

export const useFinanceiroReceitaMensal = (): Consulta<FinanceiroReceitaMensal> =>
  useView("vw_financeiro_receita_mensal", vw.financeiroReceitaMensal);

export const useFinanceiroCaixaMensal = (): Consulta<FinanceiroCaixaMensal> =>
  useView("vw_financeiro_caixa_mensal", vw.financeiroCaixaMensal);

export const useFinanceiroInadimpOrigem = (): Consulta<FinanceiroInadimplenciaOrigem> =>
  useView("vw_financeiro_inadimplencia_origem", vw.financeiroInadimpOrigem);

export const useFinanceiroAReceberHorizonte = (): Consulta<FinanceiroHorizonte> =>
  useView("vw_financeiro_a_receber_horizonte", vw.financeiroAReceberHorizonte);

export const useFinanceiroDespesaCategoria = (): Consulta<FinanceiroDespesaCategoria> =>
  useView("vw_financeiro_despesa_categoria", vw.financeiroDespesaCategoria);

export const useFinanceiroAPagarHorizonte = (): Consulta<FinanceiroHorizonte> =>
  useView("vw_financeiro_a_pagar_horizonte", vw.financeiroAPagarHorizonte);

export const useFinanceiroPagoMensal = (): Consulta<FinanceiroPagoMensal> =>
  useView("vw_financeiro_pago_mensal", vw.financeiroPagoMensal);

export const useFinanceiroReceitaCategoriaPeriodo = (): Consulta<ReceitaCategoriaPeriodo> =>
  useView("vw_financeiro_receita_categoria_periodo", vw.financeiroReceitaCategoriaPeriodo);

export const useFinanceiroDespesaCategoriaPeriodo = (): Consulta<DespesaCategoriaPeriodo> =>
  useView("vw_financeiro_despesa_categoria_periodo", vw.financeiroDespesaCategoriaPeriodo);

/* ---------- LOJA ---------- */

export const useLojaReceitaPeriodo = (): Consulta<LojaReceitaPeriodo> =>
  useView("vw_loja_receita_periodo", vw.lojaReceitaPeriodo);

export const useLojaProdutosVendidosMes = (): Consulta<LojaProdutoVendidoMes> =>
  useView("vw_loja_produtos_vendidos_mes", vw.lojaProdutosVendidosMes);

export const useLojaEstoque = (): Consulta<LojaEstoque> => useView("vw_loja_estoque", vw.lojaEstoque);

export const useLojaPerformanceCurso = (): Consulta<LojaPerformanceCurso> =>
  useView("vw_loja_performance_curso", vw.lojaPerformanceCurso);

export const useLojaReceitaTotalMes = (): Consulta<LojaMetaMes> =>
  useView("vw_loja_receita_total_mes", vw.lojaReceitaTotalMes);

export const useLojaReceitaConsolidada = (): Consulta<LojaReceitaConsolidada> =>
  useView("vw_loja_receita_consolidada", vw.lojaReceitaConsolidada);

export const useLojaSerie = (): Consulta<LojaMetaMes> => useView("vw_loja_serie", vw.lojaSerie);

export const useLojaKpisAno = (): Consulta<LojaKpiAno> => useView("vw_loja_kpis_ano", vw.lojaKpisAno);

export const useLojaKpisPeriodo = (): Consulta<LojaKpiPeriodo> =>
  useView("vw_loja_kpis_periodo", vw.lojaKpisPeriodo);

/* ---------- MARKETING ---------- */

export const useMarketingResumoMensal = (): Consulta<MarketingResumoMensal> =>
  useView("vw_marketing_resumo_mensal", vw.marketingResumoMensal);

export const useMarketingDesempenho = (): Consulta<MarketingDesempenho> =>
  useView("vw_marketing_desempenho", vw.marketingDesempenho);

export const useMarketingOrigemVendas = (): Consulta<MarketingOrigemVenda> =>
  useView("vw_marketing_origem_vendas", vw.marketingOrigemVendas);

export const useMarketingAtribuicao = (): Consulta<MarketingAtribuicao> =>
  useView("vw_marketing_atribuicao_campanha", vw.marketingAtribuicao);

/* ---------- PEDAGÓGICO ---------- */

export const usePedagogicoKpis = (): Consulta<PedagogicoKpis> =>
  useView("vw_pedagogico_kpis", vw.pedagogicoKpis);

export const usePedagogicoPresencaKpis = (): Consulta<PedagogicoPresencaKpis> =>
  useView("vw_pedagogico_presenca_kpis", vw.pedagogicoPresencaKpis);

export const usePedagogicoPresencaTempo = (): Consulta<PedagogicoPresencaTempo> =>
  useView("vw_pedagogico_presenca_tempo", vw.pedagogicoPresencaTempo);

export const usePedagogicoRecompraCurso = (): Consulta<PedagogicoRecompraCurso> =>
  useView("vw_pedagogico_recompra_curso", vw.pedagogicoRecompraCurso);

export const usePedagogicoPresencaCurso = (): Consulta<PedagogicoPresencaCurso> =>
  useView("vw_pedagogico_presenca_curso", vw.pedagogicoPresencaCurso);

export const usePedagogicoMaestrosCompleto = (): Consulta<Maestro> =>
  useView("vw_pedagogico_maestros_completo", vw.pedagogicoMaestrosCompleto);

export const usePedagogicoMaestrosKpis = (): Consulta<MaestrosKpis> =>
  useView("vw_pedagogico_maestros_kpis", vw.pedagogicoMaestrosKpis);

export const usePedagogicoMaestroAnotacoes = (): Consulta<MaestroAnotacao> =>
  useView("maestro_anotacao", vw.pedagogicoMaestroAnotacoes);

export const usePedagogicoAvaliacao = (): Consulta<PedagogicoAvaliacao> =>
  useView("vw_pedagogico_avaliacao", vw.pedagogicoAvaliacao);

export const usePedagogicoAvaliacaoKpis = (): Consulta<PedagogicoAvaliacaoKpis> =>
  useView("vw_pedagogico_avaliacao_kpis", vw.pedagogicoAvaliacaoKpis);

export const usePedagogicoRetencaoCasos = (): Consulta<CasoRetencao> =>
  useView("fato_retencao", vw.pedagogicoRetencaoCasos);

export const usePedagogicoRetencao = (): Consulta<PedagogicoRetencao> =>
  useView("vw_pedagogico_retencao", vw.pedagogicoRetencao);

export const usePedagogicoRetencaoMotivos = (): Consulta<PedagogicoRetencaoMotivo> =>
  useView("vw_pedagogico_retencao_motivos", vw.pedagogicoRetencaoMotivos);

/** Operacional: 60s de staleTime pra fila de confirmação atualizar rápido. */
export const usePedagogicoPainel = (): Consulta<TurmaPainel> =>
  useView("vw_pedagogico_painel", vw.pedagogicoPainel, { staleTime: 60 * 1000 });

export const usePedagogicoAusentes = (): Consulta<PedagogicoAusente> =>
  useView("vw_pedagogico_ausentes", vw.pedagogicoAusentes);

/* ---------- EVENTOS / DIRETORIA / INTEGRAÇÕES ---------- */

export const useEventosDesempenho = (): Consulta<EventoDesempenho> =>
  useView("vw_eventos_desempenho", vw.eventosDesempenho);

export const useDiretoriaConsol = (): Consulta<DiretoriaConsolidado> =>
  useView("vw_diretoria_consolidado", vw.diretoriaConsol);

export const useIntegracaoStatus = (): Consulta<IntegracaoStatus> =>
  useView("vw_integracao_status", vw.integracaoStatus);
