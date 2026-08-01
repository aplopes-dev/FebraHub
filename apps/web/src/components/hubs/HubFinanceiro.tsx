"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock, Database, Hourglass, Receipt, Wallet } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { ChipKpi } from "@/components/ui/ChipKpi";
import { Estado } from "@/components/ui/Estado";
import { Lista } from "@/components/ui/Lista";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { SecaoTitulo } from "@/components/ui/SecaoTitulo";
import { Donut, type SegmentoDonut } from "@/components/graficos/Donut";
import { BarrasCategoria, type LinhaCategoria } from "@/components/graficos/BarrasCategoria";
import { LinhaEvolucao } from "@/components/graficos/LinhaEvolucao";
import { CaixaCard } from "./financeiro/CaixaCard";
import {
  useFinanceiroAPagarHorizonte, useFinanceiroAReceberHorizonte, useFinanceiroCaixaHorizonte,
  useFinanceiroCaixaMensal, useFinanceiroDespesaCategoriaPeriodo, useFinanceiroFormasPagamento,
  useFinanceiroInadimpOrigem, useFinanceiroPagamentos, useFinanceiroPagoMensal,
  useFinanceiroReceitaCategoriaPeriodo, useFinanceiroReceitaMensal,
} from "@/hooks/hubs";
import { usePeriodo } from "@/lib/periodo";
import { ehSemVinculo, noPeriodo, porHorizonte, serieMensal, somarPor, tituloVazioFluxo } from "@/lib/dados";
import { moeda } from "@/lib/formato";
import { ALTURA_PAINEL, C, PALETA_FORMAS } from "@/lib/tema";

// Miolo do donut de formas: rótulo curto (último token), pra não vazar do
// centro. O nome completo fica na legenda ao lado. "Cartão/PIX CisPay" → "CisPay".
const abreviaForma = (s: unknown): string => {
  const toks = String(s ?? "").trim().split(/[\s/]+/).filter(Boolean);
  return toks.length ? toks[toks.length - 1] : "—";
};

export function HubFinanceiro() {
  const { inicio, fim, rotulo, modo } = usePeriodo();
  const recCat = useFinanceiroReceitaCategoriaPeriodo();
  const pag = useFinanceiroPagamentos();
  const caixaHor = useFinanceiroCaixaHorizonte();
  const fpag = useFinanceiroFormasPagamento();
  const recMensal = useFinanceiroReceitaMensal();
  const caixaMensal = useFinanceiroCaixaMensal();
  const inadOrig = useFinanceiroInadimpOrigem();
  const aReceberHor = useFinanceiroAReceberHorizonte();
  const despCat = useFinanceiroDespesaCategoriaPeriodo();
  const aPagarHor = useFinanceiroAPagarHorizonte();
  const pagoMensal = useFinanceiroPagoMensal();

  // Ranqueio pela receita_unidade (o que fica na Febracis), separo o
  // "Sem vínculo" pra ele nunca aparecer no topo como se fosse produto,
  // e calculo a cobertura: quanto da receita tem categoria identificada.
  const categorias = useMemo(() => {
    // `repasse` (migration 27) cobre coach, holding do CIS e treinadores de
    // mentoria — não só o coach. Nome antigo era repasse_coach.
    const recorte = somarPor(noPeriodo(recCat.data, { inicio, fim }), "categoria",
      ["receita_bruta", "receita_unidade", "repasse", "vendas"]);
    const rows: LinhaCategoria[] = recorte.map((r) => ({
      categoria: ehSemVinculo(r.categoria) ? "Sem vínculo" : String(r.categoria ?? "—"),
      vendas: Number(r.vendas ?? 0),
      bruto: Number(r.receita_bruta ?? 0),
      unidade: Number(r.receita_unidade ?? 0),
      repasse: Number(r.repasse ?? 0),
      orfa: ehSemVinculo(r.categoria),
    }));
    const reais = rows.filter((r) => !r.orfa).sort((a, b) => b.unidade - a.unidade);
    const orfas = rows.filter((r) => r.orfa);
    const total = rows.reduce((s, r) => s + r.unidade, 0);
    const vendasTot = rows.reduce((s, r) => s + r.vendas, 0);
    const semVinc = orfas.reduce((s, r) => s + r.unidade, 0);
    return { reais, orfas, total, vendasTot, semVinc, cobertura: total ? ((total - semVinc) / total) * 100 : null };
  }, [recCat.data, inicio, fim]);

  // Agrego pagos/pendentes/perdidos/sem_status somando todas as origens.
  // O donut usa o total INCLUINDO sem_status — assim "Sem status" aparece
  // como fatia honesta, não sumido do denominador.
  const pagTot = useMemo(() => {
    let pagos = 0, pend = 0, perd = 0, sem = 0, matr = 0;
    for (const r of pag.data ?? []) {
      pagos += Number(r.pagos ?? 0); pend += Number(r.pendentes ?? 0);
      perd += Number(r.perdidos ?? 0); sem += Number(r.sem_status ?? 0);
      matr += Number(r.matriculas ?? 0);
    }
    const tot = pagos + pend + perd + sem;
    return {
      pagos, pend, perd, sem, matr, tot,
      pctPago: tot ? (pagos / tot) * 100 : null,
      pctEmAberto: tot ? (pend / tot) * 100 : null,
      pctSem: matr ? (sem / matr) * 100 : (tot ? (sem / tot) * 100 : null),
    };
  }, [pag.data]);

  const aReceber = useMemo(
    () => (caixaHor.data ?? []).reduce((s, r) => s + Number(r.a_receber ?? 0), 0),
    [caixaHor.data]
  );

  // Formas de pagamento. Contrato confirmado da view: { forma, receita }.
  const formas = useMemo<SegmentoDonut[]>(() => {
    return (fpag.data ?? [])
      .map((r) => ({ rotulo: r.forma ?? "—", valor: Number(r.receita ?? 0) }))
      .filter((x) => x.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .map((f, i) => ({ ...f, cor: PALETA_FORMAS[i % PALETA_FORMAS.length] }));
  }, [fpag.data]);

  // Evolução mensal da receita (Salesforce). Mês corrente sai parcial.
  const evolucao = useMemo(() => serieMensal(recMensal.data, "receita"), [recMensal.data]);

  // Caixa CisPay. Contrato: { mes, caixa }. View pode não existir ainda.
  const caixaSerie = useMemo(() => serieMensal(caixaMensal.data, "caixa"), [caixaMensal.data]);

  /* ---- Inadimplência (Conta Azul) ---- */
  const vencidos = useMemo(
    () => (inadOrig.data ?? [])
      .map((r) => ({ rotulo: String(r.origem ?? "—"), valor: Number(r.valor_vencido ?? 0) }))
      .filter((r) => r.valor > 0)
      .sort((a, b) => b.valor - a.valor),
    [inadOrig.data]
  );
  const vencidoTot = vencidos.reduce((s, r) => s + r.valor, 0);
  const aReceber30_90 = useMemo(() => porHorizonte(aReceberHor.data, "a_receber"), [aReceberHor.data]);
  const aReceberTot = aReceber30_90.reduce((s, r) => s + r.valor, 0);

  /* ---- Despesa (Conta Azul) — "pra onde vai o dinheiro" ---- */
  // O prefixo "(-)" já vem do dado; ranqueio pelo total lançado.
  const despesas = useMemo(
    () => somarPor(noPeriodo(despCat.data, { inicio, fim }), "categoria", ["total", "pago"])
      .map((r) => ({ rotulo: String(r.categoria ?? "—"), valor: Number(r.total ?? 0), pago: Number(r.pago ?? 0) }))
      .filter((r) => r.valor > 0)
      .sort((a, b) => b.valor - a.valor),
    [despCat.data, inicio, fim]
  );
  const despesaTot = despesas.reduce((s, r) => s + r.valor, 0);
  const despesaPaga = despesas.reduce((s, r) => s + r.pago, 0);
  const aPagar = useMemo(() => porHorizonte(aPagarHor.data, "a_pagar"), [aPagarHor.data]);
  const aPagarTot = aPagar.reduce((s, r) => s + r.valor, 0);
  const evolDespesa = useMemo(() => serieMensal(pagoMensal.data, "pago"), [pagoMensal.data]);

  const statusSeg: SegmentoDonut[] = [
    { rotulo: "Pago", valor: pagTot.pagos, cor: C.up },
    { rotulo: "Em aberto", valor: pagTot.pend, cor: C.warn },
    { rotulo: "Negado", valor: pagTot.perd, cor: C.down },
    { rotulo: "Sem status", valor: pagTot.sem, cor: "#55555c" },
  ];
  const pctPagoCentro = pagTot.tot ? Math.round((pagTot.pagos / pagTot.tot) * 100) : 0;
  const ticket = categorias.vendasTot ? categorias.total / categorias.vendasTot : null;
  const formasTot = formas.reduce((s, f) => s + f.valor, 0);
  const leaderPct = formasTot ? Math.round((formas[0].valor / formasTot) * 100) : 0;
  const evolSemFonte = !!recMensal.error || evolucao.length < 2;
  const caixaSemFonte = !!caixaMensal.error || !caixaSerie.length;

  return (
    <>
      {/* Faixa de KPIs compactos — âncora dourada + 4 métricas do mês */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <ChipKpi hero Icone={Wallet} label="Receita reconhecida" valor={moeda(categorias.total)} nota={rotulo} />
        <ChipKpi Icone={Clock} label="Sem status" valor={pagTot.pctSem != null ? pagTot.pctSem.toFixed(1) : "—"} unidade="%" nota="posição atual" />
        <ChipKpi Icone={AlertTriangle} label="Em aberto" valor={pagTot.pctEmAberto != null ? pagTot.pctEmAberto.toFixed(1) : "—"} unidade="%" nota="posição atual" />
        <ChipKpi Icone={Receipt} label="Ticket médio" valor={ticket != null ? moeda(ticket) : "—"} nota={rotulo} />
        <ChipKpi Icone={Hourglass} label="A receber" valor={moeda(aReceber)} nota="CisPay · posição atual" />
      </div>

      {/* Linha 1: categoria (larga) · status donut · caixa destaque */}
      <div className="finRow1" style={{ marginBottom: 16 }}>
        <Bloco titulo="Receita por categoria" canto={rotulo} altura={ALTURA_PAINEL}>
          <Estado
            carregando={recCat.isLoading}
            erro={recCat.error}
            vazio={!categorias.reais.length && !categorias.orfas.length}
            vazioTitulo={tituloVazioFluxo(modo)}
            vazioDica={`Nenhuma receita com data entre ${inicio} e ${fim}. É normal: o negócio vende em lote — troque o período no topo.`}
          >
            <BarrasCategoria reais={categorias.reais} orfas={categorias.orfas} semVinc={categorias.semVinc} cobertura={categorias.cobertura} />
          </Estado>
        </Bloco>

        <Bloco titulo="Status de pagamento" canto={pagTot.tot ? `${pctPagoCentro}% pago` : null} altura={ALTURA_PAINEL}>
          <Estado carregando={pag.isLoading} erro={pag.error} vazio={!pagTot.tot}>
            <Donut segmentos={statusSeg} centroValor={`${pctPagoCentro}%`} centroLabel="pago" centroCor={C.up} />
            <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              <AlertTriangle size={12} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
                {pagTot.pctSem != null ? `${pagTot.pctSem.toFixed(1)}% sem status` : "Parte sem status"} — migração CisPay em andamento (Stone/legado batido a mão). <b style={{ color: C.muted }}>Não é inadimplência.</b>
              </span>
            </div>
          </Estado>
        </Bloco>

        <Bloco titulo="Caixa recebido" canto="mês · CisPay" altura={ALTURA_PAINEL}>
          <CaixaCard serie={caixaSerie} semFonte={caixaSemFonte} />
        </Bloco>
      </div>

      {/* Linha 2: evolução mensal (larga) · formas de pagamento donut */}
      <div className="finRow2">
        <Bloco titulo="Evolução mensal da receita" canto="R$ · Receita" altura={ALTURA_PAINEL}>
          {recMensal.isLoading ? (
            <Estado carregando />
          ) : evolSemFonte ? (
            <div style={{ display: "flex", gap: 9, padding: "8px 0" }}>
              <Database size={15} style={{ color: C.faint, marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Aguardando a view mensal</div>
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4, lineHeight: 1.5 }}>
                  Quando <b style={{ color: C.muted }}>vw_financeiro_receita_mensal</b> existir, a linha aparece aqui — com o mês em curso tracejado (parcial).
                </div>
              </div>
            </div>
          ) : (
            <LinhaEvolucao serie={evolucao} />
          )}
        </Bloco>

        <Bloco titulo="Formas de pagamento" canto="acumulado" altura={ALTURA_PAINEL}>
          <Estado carregando={fpag.isLoading} erro={fpag.error} vazio={!formas.length}>
            <Donut segmentos={formas} size={118} centroSize={17} centroValor={formas[0] ? abreviaForma(formas[0].rotulo) : "—"} centroLabel={`${leaderPct}% líder`} centroCor={C.gold} />
          </Estado>
        </Bloco>
      </div>

      {/* ============ INADIMPLÊNCIA ============ */}
      <SecaoTitulo titulo="Inadimplência" canto="posição atual · não muda com o período · nunca somado à receita" />
      <div className="finRow2">
        <Bloco titulo="Vencidos por origem" canto={vencidoTot ? moeda(vencidoTot) + " vencido" : null} sem altura={ALTURA_PAINEL}>
          <Estado carregando={inadOrig.isLoading} erro={inadOrig.error} vazio={!vencidos.length}>
            <Lista linhas={vencidos} total={vencidoTot} />
          </Estado>
        </Bloco>
        <Bloco titulo="A receber por horizonte" canto="30 / 60 / 90 dias" sem altura={ALTURA_PAINEL}>
          <Estado carregando={aReceberHor.isLoading} erro={aReceberHor.error} vazio={!aReceber30_90.length}>
            <Lista linhas={aReceber30_90} total={aReceberTot} />
          </Estado>
        </Bloco>
      </div>

      {/* ============ DESPESAS ============ */}
      <SecaoTitulo titulo="Despesas — para onde vai o dinheiro" canto="Conta Azul · despesa e caixa, não receita" />
      <div className="finRow2" style={{ marginBottom: 16 }}>
        <Bloco titulo="Despesa por categoria" canto={rotulo} sem altura={ALTURA_PAINEL}>
          <Estado
            carregando={despCat.isLoading}
            erro={despCat.error}
            vazio={!despesas.length}
            vazioTitulo={tituloVazioFluxo(modo)}
            vazioDica={`Nenhuma despesa com data entre ${inicio} e ${fim}. Troque o período no topo.`}
          >
            <Lista linhas={despesas} total={despesaTot} top={6} />
            <div style={{ display: "flex", gap: 8, padding: "10px 20px", background: "rgba(255,255,255,.02)" }}>
              <AlertTriangle size={12} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
                Total = despesa lançada. Já pago: <b style={{ color: C.muted }}>{moeda(despesaPaga)}</b>
                {despesaTot > 0 && <> ({((despesaPaga / despesaTot) * 100).toFixed(0)}%)</>} — o resto ainda vence.
              </span>
            </div>
          </Estado>
        </Bloco>
        <Bloco titulo="A pagar por vencimento" canto={aPagarTot ? `${moeda(aPagarTot)} · posição atual` : "posição atual"} sem altura={ALTURA_PAINEL}>
          <Estado carregando={aPagarHor.isLoading} erro={aPagarHor.error} vazio={!aPagar.length}>
            <Lista linhas={aPagar} total={aPagarTot} />
          </Estado>
        </Bloco>
      </div>

      <Bloco titulo="Evolução da despesa" canto="R$ pago · mês" altura={ALTURA_PAINEL}>
        {pagoMensal.isLoading ? (
          <Estado carregando />
        ) : pagoMensal.error || evolDespesa.length < 2 ? (
          <Estado vazio />
        ) : (
          <LinhaEvolucao serie={evolDespesa} cor={C.down} idGrad="fillDesp" inverso />
        )}
      </Bloco>

      <RodapeIntegracoes fontes={["salesforce", "conta_azul", "cispay"]} />
    </>
  );
}
