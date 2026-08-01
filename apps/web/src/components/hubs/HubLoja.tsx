"use client";

import { useMemo, useState } from "react";
import { Boxes, Package, PackageX, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { ChipKpi } from "@/components/ui/ChipKpi";
import { Estado } from "@/components/ui/Estado";
import { EstoqueNum } from "@/components/ui/EstoqueNum";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { LinhaEvolucao, type PontoEvolucao } from "@/components/graficos/LinhaEvolucao";
import { Segmentado } from "@/components/filtros/Segmentado";
import { FonteBreakdown, type FonteReceita } from "./loja/FonteBreakdown";
import { MetaBadge } from "./loja/MetaBadge";
import { PerformanceCurso, type CursoPerf, type ModoCurso } from "./loja/PerformanceCurso";
import { ProdutosVendidos } from "./loja/ProdutosVendidos";
import { produtosNoPeriodo } from "./loja/calculos";
import {
  useLojaEstoque, useLojaKpisAno, useLojaKpisPeriodo, useLojaPerformanceCurso,
  useLojaProdutosVendidosMes, useLojaReceitaConsolidada, useLojaReceitaTotalMes, useLojaSerie,
} from "@/hooks/hubs";
import { usePeriodo } from "@/lib/periodo";
import { chaveMes, tituloVazioFluxo } from "@/lib/dados";
import { moeda, numero } from "@/lib/formato";
import { C } from "@/lib/tema";
import type { LojaMetaMes } from "@/types/views";

/* Hub Loja. Receita da loja é da LOJA — nunca entra num total junto com
   curso (unidades diferentes). A série de receita é LONGA (2022-2026) e a
   fonte muda no meio: 2022-2024 = planilha de fechamento da gestora,
   2025+ = consolidado (Omie + livrão, cursos premium, aluguel, Sentido de
   Brincar). O gráfico marca a transição (tracejado→sólido) porque a queda
   entre os dois reflete a troca de fonte, não o negócio. As metas vêm todas
   da planilha (2022-2026). Vendas/ticket só existem no consolidado (2025+). */
export function HubLoja() {
  const { inicio, fim, modo, ano, mesIdx, rotulo, geral } = usePeriodo();
  const serie = useLojaSerie();
  const kpisAno = useLojaKpisAno();
  const kpisPeriodo = useLojaKpisPeriodo();
  const totalMes = useLojaReceitaTotalMes();
  const consolidada = useLojaReceitaConsolidada();
  const prodVend = useLojaProdutosVendidosMes();
  const estoque = useLojaEstoque();
  const perfCurso = useLojaPerformanceCurso();
  const [cursoModo, setCursoModo] = useState<ModoCurso>("faturamento");

  const porMes = modo === "mes" && !geral;
  // Recorte curto (Hoje / 7 dias): a fonte mensal (serie/kpisAno/total_mes) só
  // agrega por mês/ano e mostraria o acumulado, não a janela. Nesses modos os
  // cards vêm da vw_loja_kpis_periodo — que cobre SÓ produtos (PDV/Omie), a
  // única fonte com data exata. O rótulo avisa ("produtos · ...").
  const curto = modo === "hoje" || modo === "7d";
  const linhaCurta = useMemo(() => {
    if (!curto) return null;
    const alvo = modo === "hoje" ? "hoje" : "7dias";
    return (kpisPeriodo.data ?? []).find((r) => r.periodo === alvo) ?? null;
  }, [kpisPeriodo.data, curto, modo]);

  // Recorte por ANO-MÊS (dado mensal). Em "Geral", inicio/fim já são a base
  // inteira, então o mesmo filtro cobre todo o histórico.
  const noRecorte = <T,>(linhas: readonly T[] | undefined, campo: string): T[] => {
    const de = String(inicio).slice(0, 7), ate = String(fim).slice(0, 7);
    return (linhas ?? []).filter((r) => {
      const ym = String((r as Record<string, unknown>)[campo] ?? "").slice(0, 7);
      return ym !== "" && ym >= de && ym <= ate;
    });
  };

  /* RECEITA (2022-2026): por MÊS vem da série longa; por ANO/"Geral", da
     vw_loja_kpis_ano — linha por ano + a de `ano = null` (acumulado). Casa o
     ano; no Geral, a linha nula. */
  const receita = useMemo(() => {
    if (curto) return Number(linhaCurta?.receita ?? 0);
    if (porMes) {
      const alvo = chaveMes(ano, mesIdx);
      const r = (serie.data ?? []).find((x) => String(x.mes).slice(0, 7) === alvo);
      return Number(r?.receita ?? 0);
    }
    const linha = (kpisAno.data ?? []).find((r) => (geral ? r.ano == null : Number(r.ano) === Number(ano)));
    return Number(linha?.receita ?? 0);
  }, [serie.data, kpisAno.data, curto, linhaCurta, porMes, ano, mesIdx, geral]);

  /* VENDAS/TICKET. No recorte curto vêm prontos da vw_loja_kpis_periodo; nos
     demais modos, do consolidado mensal (2025+, vw_loja_receita_total_mes) —
     para 2022-2024 (sem cupom) ficam vazios, honesto. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totRecorte = useMemo(() => noRecorte(totalMes.data, "mes"), [totalMes.data, inicio, fim]);
  const vendas = curto
    ? Number(linhaCurta?.vendas ?? 0)
    : totRecorte.reduce((s, r) => s + Number(r.vendas ?? 0), 0);
  const ticket = curto
    ? (linhaCurta?.ticket_medio != null ? Number(linhaCurta.ticket_medio) : (vendas ? Number(linhaCurta?.receita ?? 0) / vendas : null))
    : (() => {
        const base = totRecorte.reduce((s, r) => s + Number(r.receita ?? 0), 0);
        return vendas ? base / vendas : null;
      })();
  // Rótulo: no curto, avisa que é só produto (PDV/Omie), não a receita cheia.
  const notaKpi = curto ? `produtos · ${String(rotulo).toLowerCase()}`
    : geral ? "todo o histórico" : porMes ? rotulo : `ano ${ano}`;

  // Série do gráfico (2022-2026): valor + meta + `provisorio` (planilha, <2025,
  // sai tracejado) + `parcial` (mês em curso). Meses ausentes (abr/2023) não
  // vêm da view, então o gráfico pula — nunca desenha zero.
  const evol = useMemo<(PontoEvolucao & { meta: number | null })[]>(() => {
    const d = new Date();
    const cm = chaveMes(d.getFullYear(), d.getMonth());
    return (serie.data ?? [])
      .filter((r) => r.mes)
      .map((r) => ({
        mes: String(r.mes),
        valor: Number(r.receita ?? 0),
        meta: r.meta_minima != null ? Number(r.meta_minima) : null,
        provisorio: String(r.mes).slice(0, 7) < "2025-01",
        parcial: !!r.em_curso || String(r.mes).slice(0, 7) === cm,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [serie.data]);
  const evolSemFonte = !!serie.error || evol.length < 2;
  const metaLinha = useMemo(() => {
    const arr = evol.map((p) => p.meta);
    return arr.some((v) => v != null) ? arr : null;
  }, [evol]);
  const temTransicao = evol.some((p) => p.provisorio) && evol.some((p) => !p.provisorio);

  /* ---- Meta x realizado ---- */
  // Selo: a linha do mês da série longa (traz meta, nível e em_curso). Em modo
  // mês, o mês escolhido; em ano, o mais recente do ano. Some no "Geral".
  const metaMes = useMemo<LojaMetaMes | null>(() => {
    if (geral) return null;
    const doAno = (serie.data ?? []).filter((r) => Number(r.ano) === Number(ano));
    if (!doAno.length) return null;
    const alvo = chaveMes(ano, mesIdx);
    return porMes
      ? doAno.find((r) => String(r.mes).slice(0, 7) === alvo) ?? null
      : [...doAno].sort((a, b) => String(a.mes).localeCompare(String(b.mes))).slice(-1)[0] ?? null;
  }, [serie.data, ano, mesIdx, porMes, geral]);

  /* ---- Quebra por fonte ---- */
  const fontes = useMemo<FonteReceita[]>(() => {
    const m = new Map<string, number>();
    for (const r of noRecorte(consolidada.data, "mes")) {
      const k = String(r.fonte ?? "—");
      m.set(k, (m.get(k) ?? 0) + Number(r.valor ?? 0));
    }
    const arr = [...m.entries()].map(([fonte, valor]) => ({ fonte, valor })).sort((a, b) => b.valor - a.valor);
    const tot = arr.reduce((s, f) => s + f.valor, 0);
    return arr.filter((f) => f.valor > 0).map((f) => ({ ...f, pct: tot ? (f.valor / tot) * 100 : 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consolidada.data, inicio, fim]);

  /* ---- Performance por curso ---- */
  // Agrega por curso no recorte; por_aluno é recalculado (média de médias mente).
  const cursos = useMemo<CursoPerf[]>(() => {
    const m = new Map<string, { curso: string; alunos: number; faturamento: number; turmas: number }>();
    for (const r of noRecorte(perfCurso.data, "mes_ref")) {
      const k = String(r.curso ?? "—");
      const a = m.get(k) ?? { curso: k, alunos: 0, faturamento: 0, turmas: 0 };
      a.alunos += Number(r.alunos ?? 0);
      a.faturamento += Number(r.faturamento ?? 0);
      a.turmas += Number(r.turmas ?? 0);
      m.set(k, a);
    }
    return [...m.values()]
      .map((c) => ({ ...c, por_aluno: c.alunos ? c.faturamento / c.alunos : 0 }))
      .filter((c) => c.faturamento > 0)
      .sort((a, b) => b[cursoModo] - a[cursoModo])
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfCurso.data, inicio, fim, cursoModo]);

  /* ---- Operacional (Omie) ---- */
  // Mais vendidos: soma os meses do recorte e ranqueia (top 5 por faturamento).
  const maisVendidos = useMemo(
    () => produtosNoPeriodo(prodVend.data, inicio, fim, 5),
    [prodVend.data, inicio, fim]
  );

  // Estoque é POSIÇÃO (snapshot do dia) — ignora o período de propósito.
  // Imobilizado a CUSTO (o capital de fato parado); o preço de venda
  // superestima. `sem_movimento` = zerado e sem mínimo cadastrado: limpeza
  // de cadastro, não reposição — a view já não marca nada como abaixo do
  // mínimo (a comparação 0 < 0 era falso positivo).
  const est = useMemo(() => {
    const linhas = estoque.data ?? [];
    return {
      total: linhas.length,
      custo: linhas.reduce((s, x) => s + Number(x.valor_custo ?? 0), 0),
      venda: linhas.reduce((s, x) => s + Number(x.valor_venda ?? 0), 0),
      semMov: linhas.filter((x) => x.sem_movimento).length,
    };
  }, [estoque.data]);

  return (
    <>
      {/* ---- Faixa 1: KPIs da loja (receita 2022-2026) ---- */}
      <div className="lojaKpis" style={{ marginBottom: 8 }}>
        <ChipKpi compacto hero Icone={Wallet} label="Receita da loja" valor={moeda(receita)} nota={notaKpi} />
        <ChipKpi compacto Icone={Receipt} label="Vendas" valor={vendas ? numero(vendas) : "—"} nota={vendas || curto ? notaKpi : "só no consolidado (2025+)"} />
        <ChipKpi compacto Icone={ShoppingBag} label="Ticket médio" valor={ticket != null ? moeda(ticket) : "—"} nota={ticket != null || curto ? notaKpi : "só no consolidado (2025+)"} />
        <ChipKpi compacto Icone={Package} label="Valor em estoque" valor={moeda(est.custo)} nota="a custo · posição atual" />
      </div>

      {/* Quebra da receita por fonte + selo de meta (some no "Geral"). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ flex: "1 1 340px", minWidth: 260 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".5px", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>
            Receita por fonte{curto ? "" : ` · ${notaKpi}`}
          </div>
          {curto
            ? <span style={{ fontSize: 11, color: C.faint }}>A quebra por fonte é mensal (consolidado) — não se aplica a Hoje / 7 dias.</span>
            : consolidada.error
              ? <span style={{ fontSize: 11, color: C.faint }}>Sem a quebra por fonte neste recorte.</span>
              : fontes.length
                ? <FonteBreakdown fontes={fontes} />
                : <span style={{ fontSize: 11, color: C.faint }}>Quebra por fonte só a partir de 2025 (consolidado).</span>}
        </div>
        {!geral && !curto && <MetaBadge meta={metaMes} />}
      </div>

      {/* ---- Faixa 2: receita mensal (consolidada, com meta) · estoque ---- */}
      <div className="lojaMid" style={{ marginBottom: 12 }}>
        <Bloco titulo="Receita mensal da loja" canto="2022–2026 · R$/mês" altura={230}>
          {serie.isLoading
            ? <Estado carregando />
            : evolSemFonte
              ? <Estado vazio />
              : <>
                  <LinhaEvolucao serie={evol} idGrad="fillLoja" mostrarNota={false}
                    rotularParcial={false} rotularVar={false} soDestaques yRedondo
                    meta={metaLinha} metaLabel="meta mínima do mês" />
                  {temTransicao && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", alignItems: "center", fontSize: 10, color: C.faint, marginTop: 4 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 16, height: 0, borderTop: `2px dashed ${C.gold}`, opacity: 0.85, flexShrink: 0 }} /> planilha (2022–2024)
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 16, height: 0, borderTop: `2px solid ${C.gold}`, flexShrink: 0 }} /> consolidado (2025+)
                      </span>
                      <span style={{ color: C.dim }}>A queda em 2025 é a <b style={{ color: C.muted }}>troca de fonte</b>, não o desempenho.</span>
                    </div>
                  )}
                </>}
        </Bloco>
        <Bloco titulo="Estoque" canto="Omie · posição atual">
          <Estado carregando={estoque.isLoading} erro={estoque.error} vazio={!est.total}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <EstoqueNum compacto Icone={Boxes} label="Produtos" valor={numero(est.total)} sub="no catálogo" />
              <EstoqueNum compacto Icone={Package} label="Imobilizado" valor={moeda(est.custo)}
                sub={`a custo (${moeda(est.venda)} a preço de venda)`} />
              <EstoqueNum compacto Icone={PackageX} label="Sem movimento" valor={numero(est.semMov)}
                sub="saldo zero e sem estoque mínimo cadastrado" />
            </div>
          </Estado>
        </Bloco>
      </div>

      {/* ---- Faixa 3: mais vendidos · performance por curso ---- */}
      <div className="lojaBot" style={{ marginBottom: 10 }}>
        <Bloco titulo="Mais vendidos" canto="Omie · top 5" sem altura={252}>
          <Estado
            carregando={prodVend.isLoading}
            erro={prodVend.error}
            vazio={!maisVendidos.length}
            vazioTitulo={tituloVazioFluxo(modo)}
            vazioDica="O Omie entrega venda por mês. Período curto (Hoje, 7 dias) pode não cruzar mês fechado — use Mês ou Ano no topo."
          >
            <ProdutosVendidos linhas={maisVendidos} />
          </Estado>
        </Bloco>
        <Bloco titulo="Performance por curso"
          canto={cursoModo === "faturamento" ? "por faturamento" : "por valor/aluno"}
          sem altura={252}>
          <div style={{ padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <Segmentado valor={cursoModo} onChange={setCursoModo}
              opcoes={[{ key: "faturamento", label: "Faturamento" }, { key: "por_aluno", label: "Por aluno" }]} />
          </div>
          <Estado
            carregando={perfCurso.isLoading}
            erro={perfCurso.error}
            vazio={!cursos.length}
            vazioTitulo={tituloVazioFluxo(modo)}
            vazioDica="Sem curso com faturamento neste recorte. Troque o período no topo."
          >
            <PerformanceCurso linhas={cursos} modo={cursoModo} formatarValor={moeda} />
            <div style={{ padding: "10px 20px 4px", fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
              Quanto a loja vende durante cada curso · planilha da gestora.
              <b style={{ color: C.muted }}> Não somar com a receita total</b> — é o mesmo dinheiro, visto por curso.
            </div>
          </Estado>
        </Bloco>
      </div>

      <RodapeIntegracoes fontes={["omie"]} />
    </>
  );
}
