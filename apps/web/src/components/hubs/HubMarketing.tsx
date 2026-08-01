"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Filter, Megaphone, Percent, Target, TrendingUp, Users } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { ChipEmBreve } from "@/components/ui/ChipEmBreve";
import { ChipKpi } from "@/components/ui/ChipKpi";
import { Estado } from "@/components/ui/Estado";
import { Lista } from "@/components/ui/Lista";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { LinhaEvolucao } from "@/components/graficos/LinhaEvolucao";
import { InvestimentoXLeads, type PontoInvLeads } from "@/components/graficos/InvestimentoXLeads";
import { FiltroTravado } from "@/components/filtros/FiltroTravado";
import { Segmentado } from "@/components/filtros/Segmentado";
import { SeletorProduto, type ProdutoMkt } from "@/components/filtros/SeletorProduto";
import { TabelaCampanhas, type CampanhaLinha, type GrupoCampanha } from "./marketing/TabelaCampanhas";
import { VendasAtribuidas, type LinhaAtribuida } from "./marketing/VendasAtribuidas";
import { CanaisVenda, type LinhaCanal } from "./marketing/CanaisVenda";
import { FunilConversao } from "./marketing/FunilConversao";
import {
  ORDEM_CAT_MKT, ROTULO_SEM_CAMPANHA, mensalDeCampanhas, noMesMkt, recorteMkt,
  rotuloVar, totaisMkt, varMkt,
} from "./marketing/calculos";
import {
  useMarketingAtribuicao, useMarketingDesempenho, useMarketingOrigemVendas,
  useMarketingResumoMensal,
} from "@/hooks/hubs";
import { usePeriodo } from "@/lib/periodo";
import { agrupar, chaveMes, tituloVazioFluxo } from "@/lib/dados";
import { moeda, numero, reaisCent } from "@/lib/formato";
import { ALTURA_PAINEL, C, GROTESK, alfa } from "@/lib/tema";
import type { MarketingResumoMensal } from "@/types/views";

export function HubMarketing() {
  const per = usePeriodo();
  const resumo = useMarketingResumoMensal();
  const desemp = useMarketingDesempenho();
  const canais = useMarketingOrigemVendas();
  const atrib = useMarketingAtribuicao();
  const [produto, setProduto] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [geral, setGeral] = useState(false);
  const [agruparPor, setAgruparPor] = useState<"produto" | "categoria">("produto");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const r = useMemo(() => recorteMkt(per, geral), [per.modo, per.ano, per.mesIdx, geral]);

  // Categorias vindas do dado, na ordem de leitura acordada.
  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const l of desemp.data ?? []) if (l.categoria) set.add(String(l.categoria));
    const ord = (c: string) => { const i = ORDEM_CAT_MKT.indexOf(c); return i < 0 ? 99 : i; };
    return [...set].sort((a, b) => ord(a) - ord(b) || a.localeCompare(b));
  }, [desemp.data]);

  // Produtos da categoria escolhida, ordenados pelo que mais consome verba.
  const produtos = useMemo<ProdutoMkt[]>(() => {
    const m = new Map<string, number>();
    for (const l of desemp.data ?? []) {
      if (categoria != null && l.categoria !== categoria) continue;
      const p = String(l.produto ?? "—");
      m.set(p, (m.get(p) ?? 0) + Number(l.gasto ?? 0));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, gasto]) => ({ nome, gasto }));
  }, [desemp.data, categoria]);

  /* Trocar de categoria pode deixar o produto escolhido fora da lista. Em vez
     de um efeito que zera o estado, o produto ATIVO é derivado: se não existe
     na categoria atual, vale "todos". */
  const prodAtivo = produto != null && produtos.some((p) => p.nome === produto) ? produto : null;

  const campanhas = useMemo(
    () => (desemp.data ?? []).filter((l) =>
      (categoria == null || l.categoria === categoria) &&
      (prodAtivo == null || l.produto === prodAtivo)),
    [desemp.data, categoria, prodAtivo]
  );

  /* Sem recorte de categoria/produto a série vem da resumo_mensal (a view
     oficial dos KPIs); com recorte, é reconstruída das campanhas. As duas
     reconciliam exatamente, então o número não pula ao ligar o filtro. */
  const serie = useMemo<MarketingResumoMensal[]>(() => {
    if (categoria == null && prodAtivo == null && resumo.data?.length)
      return [...resumo.data].sort((a, b) => String(a.mes).localeCompare(String(b.mes)));
    return mensalDeCampanhas(campanhas); // também é o fallback se a resumo falhar
  }, [categoria, prodAtivo, resumo.data, campanhas]);

  const t = useMemo(() => totaisMkt(noMesMkt(serie, r)), [serie, r]);
  const tAnt = useMemo(() => totaisMkt(noMesMkt(serie, r.ant)), [serie, r]);

  const vInv = varMkt(t.investimento, tAnt.investimento);
  const vLead = varMkt(t.leads, tAnt.leads);
  const vCpl = t.cpl != null && tAnt.cpl != null ? varMkt(t.cpl, tAnt.cpl) : null;

  // Linhas de campanha já recortadas pelo período — base de tudo que é
  // "no recorte" (quebras, tabela, contador da barra de filtros).
  const campanhasPeriodo = useMemo(() => noMesMkt(campanhas, r), [campanhas, r]);

  /* Séries dos gráficos: RESPEITAM o período escolhido. Em "Todos os anos" a
     janela cobre a base inteira, então o gráfico volta a mostrar tudo — é o
     mesmo caminho de código, sem exceção. */
  const serieGrafico = useMemo<PontoInvLeads[]>(() => {
    const d = new Date();
    const cm = chaveMes(d.getFullYear(), d.getMonth());
    return noMesMkt(serie, r).map((x) => ({
      mes: String(x.mes ?? ""),
      investimento: Number(x.investimento ?? 0),
      leads: Number(x.leads ?? 0),
      gastoCapt: Number(x.gasto_captacao ?? 0),
      leadsCapt: Number(x.leads_captacao ?? 0),
      parcial: String(x.mes).slice(0, 7) === cm,
    }));
  }, [serie, r]);

  // CPL mês a mês: recalculado por mês (gasto de captação ÷ leads de
  // captação), nunca a média das médias. Mês sem lead não vira ponto zero —
  // fica fora da série, porque "R$ 0 por lead" seria mentira.
  const serieCpl = useMemo(
    () => serieGrafico
      .filter((x) => x.leadsCapt > 0)
      .map((x) => ({ mes: x.mes, valor: x.gastoCapt / x.leadsCapt, parcial: x.parcial })),
    [serieGrafico]
  );

  const porCategoria = useMemo(() => agrupar(campanhasPeriodo, "categoria", "gasto"), [campanhasPeriodo]);

  /* Tabela agrupada por produto ou por categoria — a chave é a única coisa
     que muda, então a agregação é a mesma nos dois modos. */
  const grupos = useMemo<GrupoCampanha[]>(() => {
    const eCapt = (l: { tipo?: string | null }) => /capta/i.test(l.tipo ?? "");
    interface Acumulado {
      chave: string; gasto: number; leads: number; gastoCapt: number; leadsCapt: number;
      tipos: Set<string>; cats: Set<string>; campanhas: Map<string, CampanhaLinha>;
    }
    const m = new Map<string, Acumulado>();
    for (const l of campanhasPeriodo) {
      const k = String((agruparPor === "produto" ? l.produto : l.categoria) ?? "—");
      const g: Acumulado = m.get(k) ?? {
        chave: k, gasto: 0, leads: 0, gastoCapt: 0, leadsCapt: 0,
        tipos: new Set(), cats: new Set(), campanhas: new Map(),
      };
      const gasto = Number(l.gasto ?? 0), leads = Number(l.leads ?? 0);
      g.gasto += gasto; g.leads += leads;
      if (eCapt(l)) { g.gastoCapt += gasto; g.leadsCapt += leads; }
      if (l.tipo) g.tipos.add(l.tipo);
      if (l.categoria) g.cats.add(String(l.categoria));
      // Mesma campanha em meses diferentes vira uma linha só no recorte.
      const nome = String(l.campanha_nome ?? "—");
      const c = g.campanhas.get(nome) ?? {
        nome, tipo: l.tipo ?? "—", categoria: l.categoria ?? "—",
        gasto: 0, leads: 0, gastoCapt: 0, leadsCapt: 0, cpl: null,
      };
      c.gasto += gasto; c.leads += leads;
      if (eCapt(l)) { c.gastoCapt += gasto; c.leadsCapt += leads; }
      g.campanhas.set(nome, c);
      m.set(k, g);
    }
    const resumir = (s: Set<string>, sufixo: string) => (s.size === 1 ? [...s][0] : s.size ? `${s.size} ${sufixo}` : "—");
    return [...m.values()]
      .map((g) => ({
        chave: g.chave,
        gasto: g.gasto,
        leads: g.leads,
        tipo: resumir(g.tipos, "tipos"),
        categoria: resumir(g.cats, "categorias"),
        cpl: g.leadsCapt ? g.gastoCapt / g.leadsCapt : null,
        campanhas: [...g.campanhas.values()]
          .map((c) => ({ ...c, cpl: c.leadsCapt ? c.gastoCapt / c.leadsCapt : null }))
          .sort((a, b) => b.gasto - a.gasto),
      }))
      .sort((a, b) => b.gasto - a.gasto);
  }, [campanhasPeriodo, agruparPor]);

  /* Vendas atribuídas, agregadas por campanha dentro do recorte. Segue o
     período e a categoria; NÃO segue o produto — a view não tem essa
     dimensão, e filtrar por algo que ela não conhece devolveria vazio como
     se não houvesse venda. "Sem campanha" é uma categoria própria da view
     (nome_campanha vem nulo), então só aparece em "Todas". */
  const atribuidas = useMemo<LinhaAtribuida[]>(() => {
    const m = new Map<string, LinhaAtribuida>();
    for (const l of noMesMkt(atrib.data ?? [], r)) {
      if (categoria != null && l.categoria !== categoria) continue;
      const semCampanha = !l.nome_campanha;
      const chave = `${l.categoria ?? "—"}|${l.nome_campanha ?? ""}`;
      const a = m.get(chave) ?? {
        chave, semCampanha,
        rotulo: semCampanha ? ROTULO_SEM_CAMPANHA : String(l.nome_campanha),
        categoria: String(l.categoria ?? "—"), vendas: 0, faturamento: 0,
      };
      a.vendas += Number(l.vendas_atribuidas ?? 0);
      a.faturamento += Number(l.faturamento_atribuido ?? 0);
      m.set(chave, a);
    }
    return [...m.values()].sort((a, b) => b.faturamento - a.faturamento);
  }, [atrib.data, r, categoria]);

  const totalAtrib = useMemo(() => atribuidas.reduce(
    (s, a) => ({ vendas: s.vendas + a.vendas, faturamento: s.faturamento + a.faturamento }),
    { vendas: 0, faturamento: 0 }
  ), [atribuidas]);

  const canaisPeriodo = useMemo<LinhaCanal[]>(() => {
    const m = new Map<string, LinhaCanal>();
    for (const l of noMesMkt(canais.data ?? [], r)) {
      const k = String(l.canal ?? "—");
      const a = m.get(k) ?? { canal: k, vendas: 0, valor: 0 };
      a.vendas += Number(l.vendas ?? 0);
      a.valor += Number(l.valor ?? 0);
      m.set(k, a);
    }
    return [...m.values()].sort((a, b) => b.valor - a.valor);
  }, [canais.data, r]);

  const nota = (txt: ReactNode) => (
    <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
      <AlertTriangle size={12} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: C.faint, lineHeight: 1.5 }}>{txt}</span>
    </div>
  );

  return (
    <Estado carregando={desemp.isLoading || resumo.isLoading} erro={desemp.error} vazio={!desemp.data?.length}
      vazioTitulo="Sem dados de mídia"
      vazioDica="A vw_marketing_desempenho não retornou linhas — ou a sincronização do Meta Ads não rodou, ou seu perfil não tem acesso a marketing.">

      {/* filtros do hub: produto é real; canal e status ficam travados */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "10px 14px", marginBottom: 16, borderRadius: 12,
        background: alfa("sup", 0.022), border: `1px solid ${C.cardLine}`,
      }}>
        <Filter size={13} style={{ color: C.faint, flexShrink: 0 }} />
        <Segmentado label="Período" valor={geral} onChange={setGeral}
          opcoes={[{ key: false, label: "Filtro do topo" }, { key: true, label: "Todos os anos" }]} />
        {categorias.length > 0 && (
          <Segmentado label="Categoria" valor={categoria} onChange={setCategoria}
            opcoes={[{ key: null, label: "Todas" }, ...categorias.map((c) => ({ key: c, label: c }))]} />
        )}
        <SeletorProduto produtos={produtos} valor={prodAtivo} onChange={setProduto} />
        <FiltroTravado label="Canal" />
        <FiltroTravado label="Status" />
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.faint }}>
          {r.rotulo} · {numero(campanhasPeriodo.length)} campanhas no recorte
        </span>
      </div>

      {geral && nota(
        <>Mostrando <b style={{ color: C.muted }}>todos os anos</b> (a base do Meta Ads começa em jan/2024).
          O filtro de período do topo fica sem efeito neste hub enquanto isso estiver ligado, e as variações
          somem — não existe período anterior à base inteira.</>
      )}

      {!geral && r.diario && nota(
        <>O Meta Ads entrega gasto e leads <b style={{ color: C.muted }}>agregados por mês</b> — não existe
          recorte diário nesta fonte. Mostrando <b style={{ color: C.muted }}>{r.rotulo}</b>. Use Ano ou Mês no filtro do topo.</>
      )}

      <SecaoTitulo titulo="Mídia paga"
        canto={r.rotuloAnt ? `${r.rotulo} · variação vs ${r.rotuloAnt}` : `${r.rotulo} · base inteira, sem comparativo`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginBottom: 12 }}>
        <ChipKpi compacto hero Icone={Megaphone} label="Investimento em mídia"
          valor={moeda(t.investimento)}
          delta={rotuloVar(vInv)} up={vInv != null ? vInv >= 0 : undefined}
          nota={vInv == null ? (r.geral ? "base inteira" : "sem base anterior") : undefined}
          sub={`Meta Ads · ${r.rotulo}`} />
        <ChipKpi compacto Icone={Users} label="Leads gerados"
          valor={numero(t.leads)}
          delta={rotuloVar(vLead)} up={vLead != null ? vLead >= 0 : undefined}
          nota={vLead == null ? (r.geral ? "base inteira" : "sem base anterior") : undefined}
          sub={t.mesesSemLead
            ? `${t.mesesSemLead} ${t.mesesSemLead === 1 ? "mês" : "meses"} com verba e sem rastreio de lead`
            : "formulário de lead do Meta"} />
        <ChipKpi compacto Icone={Target} label="Custo por lead"
          valor={t.cpl != null ? reaisCent(t.cpl) : "—"}
          delta={rotuloVar(vCpl)} up={vCpl != null ? vCpl <= 0 : undefined}
          nota={vCpl == null ? (t.cpl == null ? "sem lead no recorte" : r.geral ? "base inteira" : "sem base anterior") : undefined}
          sub={t.pctCapt != null
            ? `sobre ${moeda(t.gastoCapt)} de captação · ${t.pctCapt.toFixed(0)}% da verba`
            : "sem verba de captação no recorte"} />
      </div>
      {t.pctCapt != null && t.pctCapt < 99 && nota(
        <>O custo por lead usa <b style={{ color: C.muted }}>só a verba de captação</b> ({moeda(t.gastoCapt)} de {moeda(t.investimento)}).
          Campanhas de venda, evento e live não geram lead de formulário — dividir o investimento total pelos
          leads daria um custo por lead maior que o real.</>
      )}

      <SecaoTitulo titulo="Retorno" canto="não é calculável com a cobertura de hoje" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 6 }}>
        <ChipEmBreve Icone={Percent} label="Conversão lead → venda" nota="status do lead no Clint é sempre OPEN" />
        <ChipEmBreve Icone={TrendingUp} label="ROI total" nota="exigiria dividir piso por valor cheio" />
      </div>
      {nota(
        <>Existe atribuição, mas só de <b style={{ color: C.muted }}>piso</b> — as vendas que casaram com um lead de
          anúncio (bloco abaixo). O investimento é o valor <b style={{ color: C.muted }}>cheio</b> da campanha.
          Dividir um pelo outro daria um ROI falso, parcial sobre total; por isso ele fica em branco em vez de
          receber uma conta que parece certa.</>
      )}

      <SecaoTitulo titulo="Evolução" canto={`${r.rotulo} · segue o recorte escolhido`} />
      <div className="gridCom">
        <Bloco titulo="Investimento × Leads" canto={`mês a mês · ${r.rotulo}`}>
          {serieGrafico.length < 2
            ? <Estado vazio vazioTitulo="Um mês só não faz série"
                vazioDica={`O recorte "${r.rotulo}" tem ${serieGrafico.length === 1 ? "um mês" : "nenhum mês"} com veiculação. Escolha Ano no filtro do topo, ou "Todos os anos" aqui, para ver a evolução.`} />
            : <InvestimentoXLeads serie={serieGrafico} />}
        </Bloco>
        <Bloco titulo="Investimento por categoria" canto={r.rotulo} sem altura={ALTURA_PAINEL}>
          {porCategoria.length
            ? <Lista linhas={porCategoria} formatar={moeda} total={t.investimento} />
            : <div style={{ padding: "16px 20px" }}>
                <Estado vazio vazioTitulo={tituloVazioFluxo(per.modo)} vazioDica="Nenhuma campanha com gasto neste recorte." />
              </div>}
        </Bloco>
      </div>

      <Bloco titulo="Custo por lead" canto={`mês a mês · menor é melhor · ${r.rotulo}`}>
        {serieCpl.length < 2
          ? <Estado vazio vazioTitulo="Sem série de custo por lead"
              vazioDica={`O custo por lead só existe em mês com campanha de captação e lead registrado — o recorte "${r.rotulo}" tem ${serieCpl.length === 1 ? "só um" : "nenhum"}.`} />
          : <>
              <LinhaEvolucao serie={serieCpl} cor={C.up} idGrad="fillCpl" inverso formatar={reaisCent} />
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>
                Meses sem lead de captação ficam fora da série — “R$ 0 por lead” não existe.
              </div>
            </>}
      </Bloco>

      <Bloco titulo="Performance por campanha" canto={`${r.rotulo} · clique na linha para abrir`} sem altura={340}>
        <div style={{ padding: "12px 20px 4px" }}>
          <Segmentado label="Agrupar por" valor={agruparPor} onChange={setAgruparPor}
            opcoes={[{ key: "produto", label: "Produto" }, { key: "categoria", label: "Categoria" }]} />
        </div>
        {grupos.length
          ? <TabelaCampanhas grupos={grupos} />
          : <div style={{ padding: "16px 20px" }}>
              <Estado vazio vazioTitulo={tituloVazioFluxo(per.modo)} vazioDica="Nenhuma campanha com veiculação neste recorte." />
            </div>}
      </Bloco>

      {/* Bloco à parte da tabela acima, e assim deve continuar: aqui é piso
          atribuído, lá é investimento cheio. Nenhuma conta entre os dois. */}
      <Bloco titulo="Vendas com origem confirmada em anúncio"
        canto={`${r.rotulo} · ordenado por faturamento`} sem altura={300}>
        <div style={{ padding: "12px 20px 14px", display: "flex", gap: 8, borderBottom: `1px solid ${C.hair}` }}>
          <AlertTriangle size={13} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>
            Vendas cujo comprador foi lead de anúncio antes da compra — <b style={{ color: C.bright }}>piso
            comprovável, cerca de 7% das vendas</b>. A influência real do digital é maior; isto é o que se prova.
            Não é ROI nem faturamento total.
          </span>
        </div>
        {atrib.error
          ? <div style={{ padding: "16px 20px" }}>
              <Estado vazio vazioTitulo="Não foi possível carregar a atribuição"
                vazioDica={`${atrib.error.message}. A vw_marketing_atribuicao_campanha é pesada e estoura o tempo limite na primeira execução fria — recarregar a página costuma resolver.`} />
            </div>
          : atribuidas.length
            ? <>
                <VendasAtribuidas linhas={atribuidas} />
                <div style={{
                  display: "grid", gridTemplateColumns: "minmax(150px,1fr) 88px 62px 96px", gap: 10,
                  padding: "11px 20px", background: alfa("sup", 0.02),
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: C.bright }}>Total atribuído</span>
                  <span />
                  <span style={{ fontFamily: GROTESK, fontSize: 13, fontWeight: 700, textAlign: "right", color: C.text }}>{numero(totalAtrib.vendas)}</span>
                  <span style={{ fontFamily: GROTESK, fontSize: 14, fontWeight: 700, textAlign: "right", color: C.gold }}>{moeda(totalAtrib.faturamento)}</span>
                </div>
              </>
            : <div style={{ padding: "16px 20px" }}>
                <Estado vazio vazioTitulo="Nenhuma venda atribuída neste recorte"
                  vazioDica={categoria ? `Nenhuma venda da categoria ${categoria} casou com lead de anúncio no período. A atribuição só cobre CIS e GGB até agora.` : "Nenhuma venda casou com lead de anúncio no período escolhido."} />
              </div>}
      </Bloco>

      <Bloco titulo="Origem das vendas por canal" canto="a partir de jun/2026" sem altura={ALTURA_PAINEL}>
        {canais.error
          ? <div style={{ padding: "16px 20px" }}><Estado erro={canais.error} /></div>
          : canaisPeriodo.length
            ? <>
                <CanaisVenda linhas={canaisPeriodo} />
                <div style={{ padding: "10px 20px", fontSize: 11, color: C.faint, lineHeight: 1.5 }}>
                  Cobertura cresce a cada mês; a maioria ainda cai em <b style={{ color: C.muted }}>“Pedido”</b> quando
                  o vendedor não marca a origem. Não leia como participação de mercado dos canais.
                </div>
              </>
            : <div style={{ padding: "16px 20px" }}>
                <Estado vazio vazioTitulo="Sem venda com canal neste recorte"
                  vazioDica="A vw_marketing_origem_vendas só cobre de jun/2026 em diante, e a maioria das vendas ainda entra como “Pedido”, sem canal declarado." />
              </div>}
      </Bloco>

      <Bloco titulo="Funil de conversão" canto="em construção · aguardando integração do pedagógico">
        <FunilConversao leads={t.leads} />
      </Bloco>

      <RodapeIntegracoes fontes={["meta_ads", "clint"]} />
    </Estado>
  );
}
