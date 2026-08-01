"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Database, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { ChipKpi } from "@/components/ui/ChipKpi";
import { Estado } from "@/components/ui/Estado";
import { Lista } from "@/components/ui/Lista";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { BarrasEvolucao, type PontoBarra } from "@/components/graficos/BarrasEvolucao";
import { MatriculasVsFaturamento, type PontoMatFat } from "@/components/graficos/MatriculasVsFaturamento";
import { ToggleVisao, type VisaoPodio } from "@/components/filtros/ToggleVisao";
import { CardPodio, type ItemPodio } from "./comercial/CardPodio";
import { CardComCursos, type CursoDoPodio } from "./comercial/CardComCursos";
import { LinhaPlacar, type LinhaCarinhas } from "./comercial/LinhaPlacar";
import { PainelVerdes, type VendaVerde } from "./comercial/PainelVerdes";
import {
  useComercialCarinhas, useComercialCursosPorConsultora, useComercialGeralMensal,
  useComercialMatriculasFaturamento, useComercialRankingGeralConsolidado,
  useComercialRankingHistorico, useComercialSymplaJennifer, useComercialVerdesDetalhe,
} from "@/hooks/hubs";
import { useCategoria, usePeriodo } from "@/lib/periodo";
import { CAT_GERAL, CAT_SYMPLA, noPeriodo, rotuloCat, tituloVazioFluxo } from "@/lib/dados";
import { moeda, numero } from "@/lib/formato";
import { AZUL_ANTERIOR, C } from "@/lib/tema";

/* ============ HUB COMERCIAL ============ */

export function HubComercial() {
  const { inicio, fim, rotulo, modo } = usePeriodo();
  const { categoria } = useCategoria();
  const [visao, setVisao] = useState<VisaoPodio>("periodo");
  const rankCat = useComercialRankingHistorico();
  const sympla = useComercialSymplaJennifer();
  const carinhas = useComercialCarinhas();
  const verdesDet = useComercialVerdesDetalhe();
  const matfat = useComercialMatriculasFaturamento();
  const cursos = useComercialCursosPorConsultora();
  const geralCons = useComercialRankingGeralConsolidado();
  const geralMensal = useComercialGeralMensal();

  // Consultora com o detalhe de verdes aberto (null = fechado).
  const [verdesDe, setVerdesDe] = useState<string | null>(null);

  const ehSympla = categoria === CAT_SYMPLA;
  const ehGeral = categoria === CAT_GERAL;
  // Carinhas são do time GGB; aparecem no GGB e no consolidado Geral.
  const ehGGB = String(categoria ?? "").toUpperCase() === "GGB";
  const mostraCarinhas = ehGGB || ehGeral;
  const anoAnterior = new Date().getFullYear() - 1;

  // Vendas da categoria, uma linha por venda (inclui quem já saiu — é o que
  // faz 2022 mostrar faturamento real). No Geral, a fonte de FLUXO (KPIs,
  // evolução, matrículas) é a view consolidada mensal, que já soma as 3
  // formações; nas categorias, é o histórico filtrado.
  const vendasCat = useMemo(
    () => (rankCat.data ?? []).filter((r) => String(r.categoria) === categoria),
    [rankCat.data, categoria]
  );
  const linhasFluxo = ehGeral ? (geralMensal.data ?? []) : vendasCat;
  const carregFluxo = ehGeral ? geralMensal.isLoading : rankCat.isLoading;
  const erroFluxo = ehGeral ? geralMensal.error : rankCat.error;

  /* Recorte curto (Hoje / 7 dias) conta pela data de APROVAÇÃO: uma venda
     aprovada hoje é o movimento do dia, mesmo que paga dias antes — por
     pagamento ela não aparecia. Onde não há data_aprovacao (linhas antigas)
     cai no pagamento, via coalesce, pra não sumir nada. Mês, ano e os totais
     seguem por data_pagamento (`data`/`data_pagamento`), critério do
     financeiro já validado. Só substitui a coluna de data; nada mais muda. */
  const curto = modo === "hoje" || modo === "7d";
  const recorte = <T,>(linhas: readonly T[] | undefined, faixa: { inicio: string; fim: string }, campoPag = "data"): T[] =>
    curto
      ? (linhas ?? []).filter((r) => {
          const o = r as Record<string, unknown>;
          const d = String(o.data_aprovacao ?? o[campoPag] ?? "").slice(0, 10);
          return d !== "" && d >= faixa.inicio && d <= faixa.fim;
        })
      : noPeriodo(linhas, faixa, campoPag);

  /* KPIs do período. O Comercial mostra só o BRUTO (valor_bruto = valor
     vendido): a consultora vendeu o valor cheio, o repasse não é decisão
     dela — e o líquido, após repasses, é assunto do Financeiro. As
     matrículas somam conta_matricula — comprador de vaga é receita, mas não
     é aluno, e vem com 0. YoY compara o MESMO recorte um ano atrás. */
  const kpi = useMemo(() => {
    const somaB = (ls: readonly { valor_bruto?: number | null }[]) => ls.reduce((s, r) => s + Number(r.valor_bruto ?? 0), 0);
    const somaM = (ls: readonly { conta_matricula?: number | null }[]) => ls.reduce((s, r) => s + Number(r.conta_matricula ?? 0), 0);
    const dentro = recorte(linhasFluxo, { inicio, fim }, "data");
    const menosUmAno = (d: string) => `${Number(d.slice(0, 4)) - 1}${d.slice(4)}`;
    const antes = recorte(linhasFluxo, { inicio: menosUmAno(inicio), fim: menosUmAno(fim) }, "data");
    const bruto = somaB(dentro), brutoAnt = somaB(antes), matriculas = somaM(dentro);
    return {
      receita: bruto,
      matriculas,
      ticket: matriculas ? bruto / matriculas : null,
      yoy: brutoAnt > 0 ? ((bruto - brutoAnt) / brutoAnt) * 100 : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linhasFluxo, inicio, fim]);

  /* Evolução: últimos 12 meses da categoria + o mesmo mês do ano anterior.
     Não responde ao filtro de período — é série histórica, como nos outros
     hubs. O mês corrente é parcial. */
  const evolucao = useMemo<PontoBarra[]>(() => {
    const porMes = new Map<string, number>();
    for (const r of linhasFluxo) {
      const m = String(r.data ?? "").slice(0, 7);
      if (m) porMes.set(m, (porMes.get(m) ?? 0) + Number(r.valor_bruto ?? 0)); // Comercial = bruto
    }
    const h = new Date();
    const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const atual = chave(h);
    return Array.from({ length: 12 }, (_, k) => {
      const d = new Date(h.getFullYear(), h.getMonth() - (11 - k), 1);
      const m = chave(d);
      const mAnt = `${d.getFullYear() - 1}-${m.slice(5)}`;
      return { mes: m, valor: porMes.get(m) ?? 0, anterior: porMes.get(mAnt) ?? 0, parcial: m === atual };
    });
  }, [linhasFluxo]);

  const geral = visao === "geral";

  /* Matrículas x faturamento por mês, dentro do recorte. Conta as linhas
     (volume) e soma o valor (R$) — duas grandezas, dois eixos. */
  const matFat = useMemo<PontoMatFat[]>(() => {
    if (ehSympla) return [];
    const origem = ehGeral
      ? (geralMensal.data ?? [])
      : (matfat.data ?? []).filter((r) => String(r.categoria) === categoria);
    const dentro = recorte(origem, { inicio, fim }, "data");
    const m = new Map<string, { mes: string; matriculas: number; faturamento: number }>();
    for (const r of dentro) {
      const k = String(r.mes ?? "").slice(0, 7);
      if (!k) continue;
      const a = m.get(k) ?? { mes: k, matriculas: 0, faturamento: 0 };
      a.matriculas += Number(r.conta_matricula ?? 0); // soma conta_matricula, não conta linha
      a.faturamento += Number(r.valor_bruto ?? 0);     // Comercial = bruto
      m.set(k, a);
    }
    const h = new Date();
    const atual = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}`;
    return [...m.values()].sort((a, b) => a.mes.localeCompare(b.mes))
      .map((x) => ({ ...x, parcial: x.mes === atual }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matfat.data, geralMensal.data, categoria, inicio, fim, ehSympla, ehGeral]);

  /* Top 5 cursos por consultora — em TODAS as categorias (menos Sympla, que
     é evento). No Geral, junta os cursos de todas as categorias que a
     consultora vendeu; na categoria, só os dela. Receita em BRUTO, pra bater
     com o número do card. Exibe curso_curto (abreviação oficial). Mesmo
     recorte do pódio: em "Geral" (visão) é todos os tempos, senão o período. */
  const cursosPorConsultora = useMemo(() => {
    if (ehSympla) return new Map<string, CursoDoPodio[]>();
    const doFiltro = ehGeral
      ? (cursos.data ?? [])
      : (cursos.data ?? []).filter((r) => String(r.categoria) === categoria);
    const base = geral ? doFiltro : recorte(doFiltro, { inicio, fim }, "data");
    const porNome = new Map<string, Map<string, CursoDoPodio>>();
    for (const r of base) {
      const nome = String(r.consultora ?? "");
      if (!porNome.has(nome)) porNome.set(nome, new Map());
      const cm = porNome.get(nome)!;
      const k = String(r.curso ?? "—");
      const a = cm.get(k) ?? { curso: k, curso_curto: r.curso_curto ?? r.curso, vendas: 0, receita: 0 };
      a.vendas += 1;
      a.receita += Number(r.valor_bruto ?? 0);
      cm.set(k, a);
    }
    const out = new Map<string, CursoDoPodio[]>();
    for (const [nome, cm] of porNome) {
      out.set(nome, [...cm.values()].sort((a, b) => b.receita - a.receita).slice(0, 5));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursos.data, ehSympla, ehGeral, categoria, geral, inicio, fim]);

  /* Pódio. Sympla vem de outra view (agregada, sem data): uma consultora só,
     medida em receita líquida/eventos/ingressos. */
  const podio = useMemo<ItemPodio[]>(() => {
    if (ehSympla) {
      return (sympla.data ?? []).map((s) => ({
        consultor_id: s.consultora,
        consultora: s.consultora,
        foto_url: s.foto_url,
        receita: Number(s.receita_liquida ?? 0),
        sub: `${numero(s.eventos)} eventos · ${numero(s.ingressos)} ingressos`,
      }));
    }
    // Geral usa a view consolidada (chave = consultora, sem coluna de
    // exibição); as categorias usam o histórico (chave de exibição).
    const origem = ehGeral ? (geralCons.data ?? []) : vendasCat;
    const base = geral ? origem : recorte(origem, { inicio, fim }, "data");
    const m = new Map<string, ItemPodio & { vendas: number }>();
    for (const r of base) {
      const k = ehGeral ? String(r.consultora ?? "—") : String(r.consultor_id_exibicao ?? r.consultora ?? "—");
      const a = m.get(k) ?? {
        consultor_id: k, consultora: r.consultora, foto_url: r.foto_url,
        atual: r.atual !== false, receita: 0, vendas: 0,
      };
      a.receita += Number(r.valor_bruto ?? 0); // Comercial ranqueia por bruto (valor vendido)
      a.vendas += 1;
      m.set(k, a);
    }
    return [...m.values()]
      .map((a) => ({ ...a, ticket_medio: a.vendas ? a.receita / a.vendas : 0 }))
      .sort((x, y) => y.receita - x.receita);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehSympla, ehGeral, sympla.data, geralCons.data, vendasCat, geral, inicio, fim]);

  const fonte = ehSympla ? sympla : ehGeral ? geralCons : rankCat;

  /* A view entrega uma linha por venda. A identidade das 3 consultoras vem
     da base inteira (sem recorte) e as contagens, só do período — assim o
     time aparece completo mesmo num período em que alguém não vendeu, com
     zero honesto em vez de sumir do placar. */
  const { linhas, totalPeriodo } = useMemo(() => {
    const time = new Map<string, LinhaCarinhas>();
    for (const r of carinhas.data ?? []) {
      const k = String(r.consultor_id ?? r.consultora ?? "—");
      if (!time.has(k)) {
        time.set(k, {
          consultor_id: r.consultor_id, consultora: r.consultora, foto_url: r.foto_url,
          verdes: 0, amarelas: 0, vermelhas: 0, presentes: 0, faltam: 0,
        });
      }
    }
    for (const r of recorte(carinhas.data, { inicio, fim }, "data_pagamento")) {
      const a = time.get(String(r.consultor_id ?? r.consultora ?? "—"));
      if (!a) continue;
      const cor = String(r.carinha ?? "").trim().toLowerCase();
      if (cor === "verde") a.verdes += 1;
      else if (cor === "amarelo") a.amarelas += 1;
      else if (cor === "vermelho") a.vermelhas += 1;
    }
    const arr = [...time.values()]
      .map((a) => ({ ...a, presentes: Math.floor(a.verdes / 10), faltam: 10 - (a.verdes % 10) }))
      .sort((x, y) => y.verdes - x.verdes || x.vermelhas - y.vermelhas);
    return { linhas: arr, totalPeriodo: arr.reduce((s, a) => s + a.verdes + a.amarelas + a.vermelhas, 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carinhas.data, inicio, fim]);

  // Vendas verdes da consultora aberta, recortadas pelo mesmo período do
  // filtro global (view = uma linha por venda; filtro por nome + data).
  const verdesLinhas = useMemo<VendaVerde[]>(() => {
    if (!verdesDe) return [];
    return recorte(
      (verdesDet.data ?? []).filter((v) => String(v.consultora) === verdesDe),
      { inicio, fim }, "data"
    ).map((v) => ({
      data: v.data, cliente: v.cliente, curso: v.curso,
      valor: Number(v.valor ?? 0), formas: v.formas, link_salesforce: v.link_salesforce,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdesDet.data, verdesDe, inicio, fim]);

  /* "Hoje" tende a vir vazio (poucas vendas/dia). Em vez de uma tela de
     zeros que parece erro, um estado honesto. Sympla ignora o período, então
     não entra nessa regra. */
  const semMovimentoHoje = modo === "hoje" && !ehSympla && !carregFluxo && !erroFluxo
    && kpi.receita === 0 && kpi.matriculas === 0;
  if (semMovimentoHoje) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", gap: 8, padding: "64px 24px",
        background: C.card, border: `1px solid ${C.cardLine}`, borderRadius: 16,
      }}>
        <Database size={22} style={{ color: C.faint }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: C.bright }}>Sem movimentação hoje</div>
        <div style={{ fontSize: 12.5, color: C.faint, maxWidth: 420, lineHeight: 1.55 }}>
          Nenhuma venda registrada em {rotuloCat(categoria)} hoje ({fim}). O volume é de poucas vendas por dia —
          troque o período no topo (Mês/Ano) pra ver o histórico.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* No Geral, deixa explícito o que está somado. Migration 27: passou a
          incluir todas as categorias comerciais (não só GGB+CI+CIS). */}
      {ehGeral && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          padding: "7px 12px", marginBottom: 10, borderRadius: 9,
          background: `${C.gold}0F`, border: `1px solid ${C.gold}33`,
        }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: C.gold }}>Geral · todas as categorias</span>
          <span style={{ fontSize: 10.5, color: C.faint }}>
            consolidado do Comercial (GGB, CI, CIS, Mentoria, eventos, sem categoria) · bruto vendido; o líquido, após repasses, na linha de baixo.
          </span>
        </div>
      )}

      {/* Faixa compacta: cada categoria é uma unidade de negócio, nunca somada. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 8, marginBottom: 10 }}>
        {/* Só o bruto vendido: o líquido (após repasses) vive no Financeiro,
            que é onde a informação faz sentido. */}
        <ChipKpi compacto hero Icone={Wallet}
          label={ehSympla ? "Receita · Sympla" : "Faturamento bruto · valor vendido"}
          valor={ehSympla ? moeda(podio[0]?.receita ?? 0) : moeda(kpi.receita)}
          nota={ehSympla ? "líquida · todos os tempos" : rotulo} />
        <ChipKpi compacto Icone={Receipt} label={ehSympla ? "Ingressos" : "Total de matrículas"}
          valor={ehSympla ? numero(sympla.data?.[0]?.ingressos ?? 0) : numero(kpi.matriculas)}
          nota={ehSympla ? `${numero(sympla.data?.[0]?.eventos ?? 0)} eventos` : rotulo} />
        <ChipKpi compacto Icone={TrendingUp} label="Ticket médio"
          valor={ehSympla ? "—" : (kpi.ticket != null ? moeda(kpi.ticket) : "—")}
          nota={ehSympla ? "não medível no Sympla" : "receita ÷ matrículas"} />
        <ChipKpi compacto Icone={TrendingUp} label="vs. ano anterior"
          valor={kpi.yoy != null ? `${kpi.yoy >= 0 ? "+" : ""}${kpi.yoy.toFixed(0)}%` : "—"}
          delta={kpi.yoy != null ? `${Math.abs(kpi.yoy).toFixed(0)}%` : null}
          up={kpi.yoy != null && kpi.yoy >= 0}
          nota={kpi.yoy == null ? `sem base de ${anoAnterior}` : `vs. ${anoAnterior}`} />
        {/* Não existe meta no banco — chip fica honesto em vez de inventar. */}
        <ChipKpi compacto Icone={Clock} label="% da meta" valor="—" nota="EM BREVE · sem metas" />
        {/* A ponte lead→venda não é confiável — não dá pra medir conversão. */}
        <ChipKpi compacto Icone={Clock} label="Taxa de conversão" valor="—" nota="EM BREVE · não medível" />
      </div>

      {/* Evolução à esquerda, consultoras à direita — cabe numa tela de TV. */}
      <div className="gridCom">
        <div>
        <Bloco titulo="Evolução do faturamento" canto={`${rotuloCat(categoria)} · 12 meses`}>
          <Estado
            carregando={carregFluxo}
            erro={erroFluxo}
            vazio={ehSympla || !linhasFluxo.length}
            vazioTitulo={ehSympla ? "Sympla não tem série mensal" : undefined}
            vazioDica={ehSympla ? "A view do Sympla é agregada e não traz data — sem dimensão temporal, não há evolução mensal honesta a mostrar." : undefined}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4, fontSize: 10.5, color: C.muted, fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: `linear-gradient(150deg, ${C.goldTop}, ${C.goldBase})` }} /> Período
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 13, height: 0, borderTop: `2px dashed ${AZUL_ANTERIOR}` }} /> Mesmo período {anoAnterior}
              </span>
            </div>
            <BarrasEvolucao serie={evolucao} anoAnterior={anoAnterior} />
          </Estado>
        </Bloco>

        {/* Sympla é evento, outra natureza — não entra neste cruzamento. */}
        {!ehSympla && (
          <Bloco titulo="Matrículas vs. Faturamento" canto={`${rotuloCat(categoria)} · ${rotulo}`}>
            <Estado
              carregando={ehGeral ? geralMensal.isLoading : matfat.isLoading}
              erro={ehGeral ? geralMensal.error : matfat.error}
              vazio={!matFat.length}
              vazioTitulo="Nenhuma matrícula no período"
              vazioDica={`Nada entre ${inicio} e ${fim}. Troque o período no topo.`}
            >
              <MatriculasVsFaturamento serie={matFat} />
            </Estado>
          </Bloco>
        )}
        </div>

        <div>
          <Bloco
            titulo={`Consultoras · ${rotuloCat(categoria)}`}
            canto={
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10 }}>
                  {ehSympla ? "todos os tempos" : geral ? "todos os tempos" : rotulo}
                </span>
                {!ehSympla && <ToggleVisao valor={visao} onChange={setVisao} />}
              </span>
            }
          >
            <Estado
              carregando={fonte.isLoading}
              erro={fonte.error}
              vazio={!podio.length}
              vazioTitulo={ehSympla || geral ? undefined : "Nenhuma venda no período"}
              vazioDica={ehSympla || geral ? undefined : `Nenhuma venda entre ${inicio} e ${fim}. Troque o período no topo, ou veja em "Geral".`}
            >
              {/* Hover com cursos em todas as categorias, menos Sympla (evento,
                  sem cursos). Sympla usa o card puro, sem wrapper. */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Math.max(podio.length, 1), 3)}, 1fr)`, gap: 8 }}>
                {podio.slice(0, 3).map((c, i) => (
                  ehSympla
                    ? <CardPodio key={c.consultor_id ?? c.consultora} c={c} pos={i + 1} />
                    : <CardComCursos key={c.consultor_id ?? c.consultora} c={c} pos={i + 1}
                        cursos={cursosPorConsultora.get(String(c.consultora ?? ""))} />
                ))}
              </div>
              {podio.length > 3 && (
                <div style={{ marginTop: 8 }}>
                  <Lista
                    linhas={podio.slice(3).map((c) => ({ rotulo: String(c.consultora ?? "—"), valor: c.receita, orfa: c.atual === false }))}
                    top={4}
                  />
                </div>
              )}
            </Estado>
          </Bloco>

      {/* Carinhas são do time GGB. Aparecem no GGB e no consolidado Geral
          (que inclui o GGB); nas demais categorias o bloco nem aparece. */}
      {mostraCarinhas && (
      <Bloco titulo="Placar · carinhas" canto={`${rotulo} · GGB · público`} sem altura={210}>
        <Estado
          carregando={carinhas.isLoading}
          erro={carinhas.error}
          vazio={!totalPeriodo}
          vazioTitulo={tituloVazioFluxo(modo)}
          vazioDica={`Nenhuma venda classificada entre ${inicio} e ${fim}. É normal: o negócio vende em lote — troque o período no topo.`}
        >
          {linhas.map((p) => (
            <LinhaPlacar key={p.consultor_id ?? p.consultora} p={p}
              onVerdes={() => setVerdesDe(String(p.consultora ?? ""))} />
          ))}
          <div style={{ display: "flex", gap: 8, padding: "10px 20px", background: "rgba(255,255,255,.02)" }}>
            <AlertTriangle size={12} style={{ color: C.warn, marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
              <b style={{ color: C.up }}>Verde</b> = venda 100% Pix, transferência ou dinheiro.{" "}
              <b style={{ color: C.warn }}>Amarela</b> = mistura (parte Pix, parte cartão).{" "}
              <b style={{ color: C.down }}>Vermelha</b> = 100% Stone. A cada{" "}
              <b style={{ color: C.muted }}>10 verdes</b>, um brinde surpresa. A base vai desde
              jan/2025 e está recortada pelo período do topo. Placar público: todas veem o de todas.
            </span>
          </div>
        </Estado>
      </Bloco>
      )}
        </div>
      </div>

      <RodapeIntegracoes fontes={ehSympla ? ["sympla"] : ["salesforce", "cispay"]} />

      {verdesDe && (
        <PainelVerdes
          consultora={verdesDe}
          rotulo={rotulo}
          linhas={verdesLinhas}
          carregando={verdesDet.isLoading}
          erro={verdesDet.error}
          onFechar={() => setVerdesDe(null)}
        />
      )}
    </>
  );
}
