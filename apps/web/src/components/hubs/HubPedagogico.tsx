"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, BookOpen, ChevronDown, ChevronUp, Clock, Crown, Link2, PhoneCall,
  Plus, Repeat, Send, ShieldAlert, ShieldCheck, Star, Target, TrendingUp, Upload, UserCheck,
  Users, Wallet,
} from "lucide-react";
import { Bloco } from "@/components/ui/Bloco";
import { ChipKpi } from "@/components/ui/ChipKpi";
import { Estado } from "@/components/ui/Estado";
import { ModalCentro } from "@/components/ui/ModalCentro";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { TileValidade } from "@/components/ui/TileValidade";
import { LinhaPresenca, type PontoPresenca } from "@/components/graficos/LinhaPresenca";
import { Segmentado } from "@/components/filtros/Segmentado";
import { FormAvaliacaoEvento } from "@/components/formularios/FormAvaliacaoEvento";
import { FormAvaliacaoGGB } from "@/components/formularios/FormAvaliacaoGGB";
import { FormMaestro } from "@/components/formularios/FormMaestro";
import { FormRetencao } from "@/components/formularios/FormRetencao";
import { FaixaPendencias } from "./pedagogico/FaixaPendencias";
import { LinhaMaestro } from "./pedagogico/LinhaMaestro";
import { LinhaRetencao } from "./pedagogico/LinhaRetencao";
import { ListaAvaliacao } from "./pedagogico/ListaAvaliacao";
import { ListaMotivos } from "./pedagogico/ListaMotivos";
import { RankingCurso, type LinhaRankingCurso } from "./pedagogico/RankingCurso";
import { TabelaConfirmacoes } from "./pedagogico/TabelaConfirmacoes";
import {
  usePedagogicoAusentes, usePedagogicoAvaliacao, usePedagogicoAvaliacaoKpis, usePedagogicoKpis,
  usePedagogicoMaestroAnotacoes, usePedagogicoMaestrosCompleto, usePedagogicoMaestrosKpis,
  usePedagogicoPainel, usePedagogicoPresencaCurso, usePedagogicoPresencaKpis,
  usePedagogicoPresencaTempo, usePedagogicoRecompraCurso, usePedagogicoRetencao,
  usePedagogicoRetencaoCasos, usePedagogicoRetencaoMotivos,
} from "@/hooks/hubs";
import { rotuloTri } from "@/lib/dados";
import { fmtPct, moeda, numero, pctTaxa } from "@/lib/formato";
import { C, GROTESK, SANS } from "@/lib/tema";
import type { CasoRetencao, Maestro, PedagogicoAvaliacaoKpis, TurmaPainel } from "@/types/views";

/* Hub Pedagógico / Sucesso do Cliente. Foco em SAÚDE: acompanhamento, não
   fila de tarefas. Tudo vem do Salesforce; conclusão, notas e NPS não são
   medidos (não existem na fonte). Presença cobre só as turmas com
   credenciamento confiável. */
export function HubPedagogico() {
  const kpis = usePedagogicoKpis();
  const presKpis = usePedagogicoPresencaKpis();
  const presTempo = usePedagogicoPresencaTempo();
  const recompraCurso = usePedagogicoRecompraCurso();
  const presCurso = usePedagogicoPresencaCurso();
  const maestros = usePedagogicoMaestrosCompleto();
  const maestrosKpis = usePedagogicoMaestrosKpis();
  const anotacoes = usePedagogicoMaestroAnotacoes();
  const avaliacao = usePedagogicoAvaliacao();
  const avaliacaoKpis = usePedagogicoAvaliacaoKpis();
  const retencaoCasos = usePedagogicoRetencaoCasos();
  const retencao = usePedagogicoRetencao();
  const retencaoMotivos = usePedagogicoRetencaoMotivos();
  const painel = usePedagogicoPainel();
  const ausentes = usePedagogicoAusentes();
  const qc = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [turmaSel, setTurmaSel] = useState<TurmaPainel | null>(null); // turma aberta no drawer (bloco 2)
  const [verReativar, setVerReativar] = useState(false);
  const [statusMaestro, setStatusMaestro] = useState("todos");
  const [modalAv, setModalAv] = useState<"ggb" | "evento" | null>(null);
  const [maestroEdit, setMaestroEdit] = useState<Maestro | null>(null); // maestro sendo editado
  const [retEdit, setRetEdit] = useState<CasoRetencao | "novo" | null>(null); // 'novo' | caso | null

  // Após gravar: recarrega as views afetadas e fecha o modal.
  const aposSalvar = () => { qc.invalidateQueries(); setModalAv(null); setMaestroEdit(null); setRetEdit(null); };
  // cargo não vem na view _completo — pré-preenche do maestro_anotacao cru.
  const cargoPorCpf = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of anotacoes.data ?? []) if (a.aluno_id != null) m.set(String(a.aluno_id), a.cargo ?? "");
    return m;
  }, [anotacoes.data]);

  const k = kpis.data?.[0] ?? {};
  const pk = presKpis.data?.[0] ?? {};
  const cursosPorAluno = k.cursos_por_aluno != null
    ? Number(k.cursos_por_aluno).toLocaleString("pt-BR", { maximumFractionDigits: 1 })
    : "—";

  // Série trimestral: amostra pequena (<30 matrículas) fica de-enfatizada.
  const serieTri = useMemo<PontoPresenca[]>(() =>
    (presTempo.data ?? [])
      .filter((r) => r.periodo != null)
      .map((r) => ({
        rotulo: rotuloTri(r.periodo),
        taxa: pctTaxa(r.taxa_comparecimento),
        amostra: Number(r.matriculas ?? 0),
        pequena: Number(r.matriculas ?? 0) < 30,
      }))
      .sort((a, b) => String(a.rotulo).localeCompare(String(b.rotulo))),
    [presTempo.data]);
  const temPequena = serieTri.some((p) => p.pequena);

  // Cursos que mais fidelizam (recompra desc).
  const fideliza = useMemo<LinhaRankingCurso[]>(() =>
    (recompraCurso.data ?? [])
      .map((r) => ({ rotulo: r.curso ?? "—", valor: pctTaxa(r.taxa_recompra), amostra: Number(r.alunos ?? 0) }))
      .filter((r) => r.amostra > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6),
    [recompraCurso.data]);

  // Cursos com mais falta: mostra a % que FALTOU (100 − comparecimento), piores no topo.
  const maisFalta = useMemo<LinhaRankingCurso[]>(() =>
    (presCurso.data ?? [])
      .map((r) => ({ rotulo: r.curso ?? "—", valor: 100 - pctTaxa(r.taxa_comparecimento), amostra: Number(r.matriculas ?? 0) }))
      .filter((r) => r.amostra > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6),
    [presCurso.data]);

  // Maestros (VIP): lista por investido (desc), com filtro por status de
  // validade. Ativos/inativos/média saem da agregação do detalhe (a view de
  // kpis não os traz); os contadores de VALIDADE (válidos/perto/vencidos) vêm
  // da vw_pedagogico_maestros_kpis, mesma fonte do selo por linha.
  const listaMaestros = useMemo(() => {
    const arr = [...(maestros.data ?? [])].sort((a, b) => Number(b.total_investido ?? 0) - Number(a.total_investido ?? 0));
    if (statusMaestro === "todos") return arr;
    return arr.filter((m) => String(m.status_maestria ?? "").trim().toLowerCase() === statusMaestro);
  }, [maestros.data, statusMaestro]);
  const maestrosKpi = useMemo(() => {
    const arr = maestros.data ?? [];
    const ativos = arr.filter((m) => m.ativo).length;
    const invest = arr.reduce((s, m) => s + Number(m.total_investido ?? 0), 0);
    const fatGrupo = arr.reduce((s, m) => s + Number(m.faturamento ?? 0), 0);
    return { total: arr.length, ativos, inativos: arr.length - ativos, media: arr.length ? invest / arr.length : 0, fatGrupo };
  }, [maestros.data]);
  const mk = maestrosKpis.data?.[0] ?? {};
  const temMaestros = (maestros.data?.length ?? 0) > 0;

  // Avaliações separadas por fonte; KPIs (contagens) por fonte.
  const avGGB = useMemo(() => (avaliacao.data ?? []).filter((r) => r.fonte === "ggb"), [avaliacao.data]);
  const avEvento = useMemo(() => (avaliacao.data ?? []).filter((r) => r.fonte === "evento"), [avaliacao.data]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const avKpi = useMemo(() => {
    const m = new Map<string, PedagogicoAvaliacaoKpis>();
    for (const r of avaliacaoKpis.data ?? []) m.set(String(r.fonte ?? ""), r);
    return m;
  }, [avaliacaoKpis.data]);

  // Retenção: casos recentes primeiro; motivos por frequência (retidos+cancel).
  const casos = useMemo(() =>
    [...(retencaoCasos.data ?? [])].sort((a, b) => String(b.data_ligacao ?? "").localeCompare(String(a.data_ligacao ?? ""))),
    [retencaoCasos.data]);
  const pendentes = useMemo(() => casos.filter((c) => String(c.desfecho ?? "").trim().toLowerCase() === "pendente").length, [casos]);
  const motivos = useMemo(() =>
    [...(retencaoMotivos.data ?? [])].sort((a, b) => (Number(b.retidos ?? 0) + Number(b.cancelados ?? 0)) - (Number(a.retidos ?? 0) + Number(a.cancelados ?? 0))),
    [retencaoMotivos.data]);
  const ret = retencao.data?.[0] ?? {};

  // Automação de confirmações: derivações do painel (1 linha por turma).
  const turmasPainel = painel.data ?? [];
  const pendencias = useMemo(() => turmasPainel.filter((t) => t.pendencia != null), [turmasPainel]);
  const confKpi = useMemo(() => {
    const fila = turmasPainel.reduce((s, t) => s + Math.max(0, Number(t.matriculados ?? 0) - Number(t.confirmacao_enviada ?? 0)), 0);
    const aguardando = turmasPainel.reduce((s, t) => s + Number(t.aguardando_link_grupo ?? 0), 0);
    const conf = turmasPainel.reduce((s, t) => s + Number(t.confirmaram ?? 0), 0);
    const env = turmasPainel.reduce((s, t) => s + Number(t.confirmacao_enviada ?? 0), 0);
    return { fila, aguardando, taxa: env > 0 ? (conf / env) * 100 : null };
  }, [turmasPainel]);
  const abrirTurma = (t: TurmaPainel) => setTurmaSel(t);

  const reativar = ausentes.data ?? [];

  return (
    <>
      {/* ---- Faixa de pendências da automação (topo; só se houver) ---- */}
      <FaixaPendencias pendencias={pendencias} onAbrir={abrirTurma} />

      {/* ---- KPIs de saúde ---- */}
      <div className="pedKpis" style={{ marginBottom: 12 }}>
        <ChipKpi compacto hero Icone={Repeat} label="Recompra (grade)" valor={fmtPct(k.taxa_recompra, 1)} nota="cursos CIS + GGB" />
        <ChipKpi compacto Icone={UserCheck} label="Comparecimento" valor={fmtPct(pk.taxa_comparecimento_geral)}
          sub={pk.turmas_cobertas ? `${numero(pk.turmas_cobertas)} turmas credenciadas` : "turmas credenciadas"} />
        <ChipKpi compacto Icone={Users} label="Alunos únicos" valor={k.alunos_unicos != null ? numero(k.alunos_unicos) : "—"} nota="na base" />
        <ChipKpi compacto Icone={BookOpen} label="Cursos por aluno" valor={cursosPorAluno} nota="média" />
      </div>

      {/* ---- Comparecimento no tempo (largura total) ---- */}
      <Bloco titulo="Comparecimento no tempo" canto="taxa por trimestre">
        <Estado carregando={presTempo.isLoading} erro={presTempo.error} vazio={serieTri.length < 2}
          vazioTitulo="Sem série de presença" vazioDica="Aparece com o setor pedagógico conectado.">
          <LinhaPresenca serie={serieTri} />
          {temPequena && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: C.faint, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", border: `1.2px solid ${C.faint}`, flexShrink: 0 }} />
              trimestres com menos de 30 matrículas — amostra pequena, fora da linha
            </div>
          )}
        </Estado>
      </Bloco>

      {/* ---- Maestros (clientes VIP · compraram MAESTRIA) ---- */}
      <Bloco titulo="Maestros" canto="clientes VIP · MAESTRIA" sem>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <div className="pedMaestrosKpi">
            <ChipKpi compacto hero Icone={Crown} label="Maestros" valor={temMaestros ? numero(maestrosKpi.total) : "—"} nota="clientes VIP" />
            <ChipKpi compacto Icone={UserCheck} label="Ativos" valor={temMaestros ? numero(maestrosKpi.ativos) : "—"} nota="compra < 12 meses" />
            <ChipKpi compacto Icone={AlertTriangle} label="Inativos" valor={temMaestros ? numero(maestrosKpi.inativos) : "—"} nota="+ de 12 meses parado" />
            <ChipKpi compacto Icone={Wallet} label="Média investida" valor={temMaestros ? moeda(maestrosKpi.media) : "—"} nota="por maestro" />
            <ChipKpi compacto Icone={TrendingUp} label="Faturamento do grupo" valor={maestrosKpi.fatGrupo ? moeda(maestrosKpi.fatGrupo) : "—"} nota="anotado · empresas" />
            {/* Validade da Maestria (12 meses desde a compra) — números coloridos. */}
            <TileValidade Icone={ShieldCheck} label="Válidos" valor={temMaestros ? numero(mk.validos) : "—"} cor={C.up} nota="vigente" />
            <TileValidade Icone={Clock} label="Perto de vencer" valor={temMaestros ? numero(mk.perto_vencer) : "—"} cor={C.warn} nota="agir" />
            <TileValidade Icone={ShieldAlert} label="Vencidos" valor={temMaestros ? numero(mk.vencidos) : "—"} cor={C.down} nota="renovar" />
          </div>
        </div>
        {/* Filtro por status de validade — ajuda a gestora a agir nos que vão vencer. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "10px 20px", borderBottom: `1px solid ${C.hair}` }}>
          <Segmentado label="Validade" valor={statusMaestro} onChange={setStatusMaestro}
            opcoes={[{ key: "todos", label: "Todos" }, { key: "perto de vencer", label: "Perto de vencer" }, { key: "vencido", label: "Vencidos" }, { key: "válido", label: "Válidos" }]} />
          <span style={{ fontSize: 10.5, color: C.faint }}>{numero(listaMaestros.length)} {listaMaestros.length === 1 ? "maestro" : "maestros"}</span>
        </div>
        <div className="rolagem" style={{ maxHeight: 250, overflowY: "auto" }}>
          <Estado carregando={maestros.isLoading} erro={maestros.error} vazio={!listaMaestros.length}
            vazioTitulo={temMaestros ? "Nenhum maestro nesse status" : "Sem maestros no acesso"}
            vazioDica={temMaestros ? "Troque o filtro de validade acima." : "Painel restrito ao setor pedagógico — aparece com o setor conectado."}>
            {listaMaestros.map((m, i) => <LinhaMaestro key={i} m={m} onEditar={setMaestroEdit} />)}
          </Estado>
        </div>
        <div style={{ padding: "8px 20px", fontSize: 10, color: C.dim, borderTop: `1px solid ${C.hair}` }}>
          Contém dados pessoais (nome, e-mail, telefone) — exceção justificada, restrita ao setor pedagógico.
        </div>
      </Bloco>

      {/* ---- Cursos: fidelizam · faltam ---- */}
      <div className="pedBot" style={{ marginBottom: 12 }}>
        <Bloco titulo="Cursos que mais fidelizam" canto="recompra do aluno" sem altura={250}>
          <Estado carregando={recompraCurso.isLoading} erro={recompraCurso.error} vazio={!fideliza.length}
            vazioTitulo="Sem recompra por curso" vazioDica="Aparece com o setor pedagógico conectado.">
            <RankingCurso linhas={fideliza} cor={C.gold} sufixo="alunos" />
          </Estado>
        </Bloco>
        <Bloco titulo="Cursos com mais falta" canto="% que faltou · piores no topo" sem altura={250}>
          <Estado carregando={presCurso.isLoading} erro={presCurso.error} vazio={!maisFalta.length}
            vazioTitulo="Sem falta por curso" vazioDica="Aparece com o setor pedagógico conectado.">
            <RankingCurso linhas={maisFalta} cor={C.warn} sufixo="matrículas" />
          </Estado>
        </Bloco>
      </div>

      {/* ---- Avaliações (GGB colado + Eventos por CSV) ---- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Star size={15} style={{ color: C.gold, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Avaliações</span>
          <span style={{ fontSize: 11, color: C.faint }}>indicação dos alunos · nota do treinador</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setModalAv("ggb")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 700, fontFamily: SANS }}>
            <Plus size={13} /> Colar notas GGB
          </button>
          <button onClick={() => setModalAv("evento")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 700, fontFamily: SANS }}>
            <Upload size={13} /> Anexar CSV de evento
          </button>
        </div>
      </div>
      <div className="pedBot" style={{ marginBottom: 12 }}>
        <Bloco titulo="GGB" canto={`indicação + treinador · ${numero(avGGB.length)} curso(s)`} sem altura={230}>
          <Estado carregando={avaliacao.isLoading} erro={avaliacao.error} vazio={!avGGB.length}
            vazioTitulo="Sem avaliações GGB" vazioDica='Use "Colar notas GGB" para registrar a primeira.'>
            <ListaAvaliacao linhas={avGGB} comTreinador />
          </Estado>
        </Bloco>
        <Bloco titulo="Eventos" canto={`indicação · escala 1–5 · ${numero(avEvento.length)} evento(s)`} sem altura={230}>
          <Estado carregando={avaliacao.isLoading} erro={avaliacao.error} vazio={!avEvento.length}
            vazioTitulo="Sem avaliações de evento" vazioDica='Use "Anexar CSV de evento" para registrar.'>
            <ListaAvaliacao linhas={avEvento} comTreinador={false} />
          </Estado>
        </Bloco>
      </div>

      {/* ---- Retenção (entrada manual: ligações de win-back) ---- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <PhoneCall size={15} style={{ color: C.up, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Retenção</span>
          <span style={{ fontSize: 11, color: C.faint }}>ligações de win-back · sucesso da equipe</span>
        </div>
        <button onClick={() => setRetEdit("novo")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 700, fontFamily: SANS }}>
          <Plus size={13} /> Registrar caso
        </button>
      </div>
      <div className="pedKpis" style={{ marginBottom: 12 }}>
        <ChipKpi compacto hero Icone={PhoneCall} label="Casos" valor={ret.total_casos != null ? numero(ret.total_casos) : "—"} nota={pendentes ? `${numero(pendentes)} pendentes` : "ligações"} />
        <ChipKpi compacto Icone={ShieldCheck} label="Retidos" valor={ret.retidos != null ? numero(ret.retidos) : "—"} nota="win-back" />
        <ChipKpi compacto Icone={AlertTriangle} label="Cancelados" valor={ret.cancelados != null ? numero(ret.cancelados) : "—"} nota="perdidos" />
        <ChipKpi compacto Icone={Target} label="Taxa de retenção" valor={fmtPct(ret.taxa_retencao)} nota="sucesso da equipe" />
      </div>
      <div className="pedBot" style={{ marginBottom: 12 }}>
        <Bloco titulo="Casos" canto={`recentes primeiro · ${numero(casos.length)}`} sem altura={250}>
          <Estado carregando={retencaoCasos.isLoading} erro={retencaoCasos.error} vazio={!casos.length}
            vazioTitulo="Sem casos registrados" vazioDica='Use "Registrar caso" para lançar a primeira ligação.'>
            {casos.map((c) => <LinhaRetencao key={c.id} c={c} onEditar={setRetEdit} />)}
          </Estado>
        </Bloco>
        <Bloco titulo="Motivos mais frequentes" canto="retidos × cancelados" sem altura={250}>
          <Estado carregando={retencaoMotivos.isLoading} erro={retencaoMotivos.error} vazio={!motivos.length}
            vazioTitulo="Sem motivos ainda" vazioDica="Aparecem conforme os casos são registrados.">
            <ListaMotivos linhas={motivos} />
          </Estado>
        </Bloco>
      </div>

      {/* ---- Reativação (secundária: foco é saúde, não ação) ---- */}
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setVerReativar((v) => !v)} style={{
          display: "inline-flex", alignItems: "center", gap: 7, background: "transparent",
          border: `1px solid ${C.cardLine}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer",
          color: C.muted, fontSize: 12, fontWeight: 600, fontFamily: SANS,
        }}>
          <Activity size={14} /> Lista de reativação{reativar.length ? ` · ${numero(reativar.length)} alunos` : ""}
          {verReativar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {verReativar && (
          <div style={{ marginTop: 10 }}>
            <Bloco titulo="Reativação" canto="ausentes · secundário" sem altura={230}>
              <Estado carregando={ausentes.isLoading} erro={ausentes.error} vazio={!reativar.length}
                vazioTitulo="Ninguém para reativar" vazioDica="Aparece com o setor pedagógico conectado.">
                <div>
                  {reativar.slice(0, 60).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "7px 20px", borderBottom: `1px solid ${C.hair}` }}>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                        <span style={{ fontFamily: GROTESK, fontSize: 11, color: C.faint, flexShrink: 0 }}>#{r.aluno_id}</span>
                        <span style={{ fontSize: 12.5, color: C.bright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.curso ?? ""}>{r.curso ?? "—"}</span>
                        {r.turma && <span style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>· {r.turma}</span>}
                      </span>
                      <span style={{ fontFamily: GROTESK, fontSize: 12.5, fontWeight: 700, color: C.muted, flexShrink: 0 }}>{moeda(r.valor)}</span>
                    </div>
                  ))}
                </div>
              </Estado>
            </Bloco>
          </div>
        )}
      </div>

      {/* ---- Automação de confirmações (KPIs + tabela; drawer no bloco 2) ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
        <Send size={15} style={{ color: C.gold, flexShrink: 0 }} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bright }}>Automação de confirmações</span>
        <span style={{ fontSize: 11, color: C.faint }}>fila de presença · grupos de WhatsApp</span>
      </div>
      <div className="pedConfKpis" style={{ marginBottom: 12 }}>
        <ChipKpi compacto hero Icone={Send} label="Fila de confirmação" valor={numero(confKpi.fila)} nota="aguardando 1ª mensagem" />
        <ChipKpi compacto Icone={Link2} label="Aguardando link do grupo" valor={numero(confKpi.aguardando)} nota="confirmaram, sem grupo" />
        <ChipKpi compacto Icone={UserCheck} label="Taxa de confirmação" valor={fmtPct(confKpi.taxa)} nota="responderam SIM" />
      </div>
      <Bloco titulo="Turmas" canto="clique para abrir · cadastro e links" sem altura={320}>
        <Estado carregando={painel.isLoading} erro={painel.error} vazio={!turmasPainel.length}
          vazioTitulo="Nenhuma turma futura" vazioDica="As turmas aparecem aqui conforme entram no Salesforce.">
          <TabelaConfirmacoes turmas={turmasPainel} onAbrir={abrirTurma} />
        </Estado>
      </Bloco>

      {/* ---- Transparência ---- */}
      <div style={{ fontSize: 11, color: C.faint, lineHeight: 1.6, marginTop: 4 }}>
        <b style={{ color: C.muted }}>Transparência.</b> A presença cobre {pk.turmas_cobertas ? numero(pk.turmas_cobertas) : "—"} turmas
        com credenciamento confiável; as demais ficam de fora do comparecimento. Conclusão, notas e NPS
        não são medidos — não estão no Salesforce.
      </div>

      <RodapeIntegracoes fontes={["salesforce"]} />

      {/* ---- Modais de entrada (gravam nas tabelas; a API gate o pedagógico) ---- */}
      {modalAv === "ggb" && (
        <ModalCentro titulo="Avaliação GGB — colar respostas" largura={640} onFechar={() => setModalAv(null)}>
          <FormAvaliacaoGGB onSalvo={aposSalvar} />
        </ModalCentro>
      )}
      {modalAv === "evento" && (
        <ModalCentro titulo="Avaliação de evento — anexar CSV" onFechar={() => setModalAv(null)}>
          <FormAvaliacaoEvento onSalvo={aposSalvar} />
        </ModalCentro>
      )}
      {maestroEdit && (
        <ModalCentro titulo="Editar maestro" onFechar={() => setMaestroEdit(null)}>
          <FormMaestro maestro={maestroEdit} cargoInicial={cargoPorCpf.get(String(maestroEdit.cpf)) ?? ""} onSalvo={aposSalvar} />
        </ModalCentro>
      )}
      {retEdit && (
        <ModalCentro titulo={retEdit === "novo" ? "Registrar caso de retenção" : "Editar caso de retenção"} onFechar={() => setRetEdit(null)}>
          <FormRetencao caso={retEdit === "novo" ? null : retEdit} onSalvo={aposSalvar} />
        </ModalCentro>
      )}
    </>
  );
}
