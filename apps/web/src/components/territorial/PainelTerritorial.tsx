"use client";

/* ============================================================
   INTELIGÊNCIA TERRITORIAL — reconstrução fiel do dashboard do
   hub.aplopes.com dentro do FebraHub (mesmas APIs, agora autenticadas;
   mesmos dados, migrados para este banco).

   Estrutura do original: coluna de filtros fixa à esquerda (desktop),
   KPIs, mapa com legenda/camadas e tabela sincronizados pelo MESMO
   recorte — refletido na URL. No mobile os filtros viram bottom-sheet.
   Tema claro/escuro entra pelo escopo .tio (src/app/territorial.css).
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  CircleDollarSign,
  Contact,
  Crown,
  Download,
  Landmark,
  ListFilter,
  Map as MapIcon,
  MapPin,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import { REVENUE_RANGE_MAP } from "@/lib/territorial/tipos";
import type { FiltrosTerritorial as Filtros } from "@/lib/territorial/tipos";
import { formatBRLCompact, formatInt, formatPct } from "@/lib/territorial/formato";
import {
  useConexoesTerritorial,
  useDetalheEmpresa,
  useEstadoTerritorial,
  useMetricasTerritorial,
  usePontosMapa,
} from "@/hooks/territorial";
import { exportarEmpresas } from "@/services/api/territorial";
import { FiltrosTerritorial } from "./FiltrosTerritorial";
import { TabelaEmpresas } from "./TabelaEmpresas";
import { DrawerEmpresa } from "./DrawerEmpresa";
import { exportarCsv, exportarPdf, exportarXlsx } from "./exportar";
import { Botao, Skeleton } from "./ui";

// WebGL não renderiza no servidor; o mapa entra só no cliente. O wrapper de
// loading tem a MESMA moldura para o layout não pular quando o mapa chega.
const MapaTerritorial = dynamic(
  () => import("./MapaTerritorial").then((m) => m.MapaTerritorial),
  {
    ssr: false,
    loading: () => (
      <div
        className="tio-mapa-moldura tio-glass"
        style={{ display: "grid", placeItems: "center", color: "var(--ink-dim)", fontSize: 13 }}
      >
        Preparando o mapa…
      </div>
    ),
  },
);

/* ------------------------------- KPIs ------------------------------- */

function CartaoKpi({
  icone,
  rotulo,
  children,
  hint,
  corIcone,
}: {
  icone: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
  hint?: string;
  corIcone?: string;
}) {
  return (
    <div className="tio-kpi tio-glass" role="group" aria-label={rotulo}>
      <div className="tio-kpi-rotulo">
        <span style={corIcone ? { color: corIcone, display: "inline-flex" } : { display: "inline-flex" }}>
          {icone}
        </span>
        {rotulo}
      </div>
      <div className="tio-kpi-valor tio-display" title={hint}>
        {children}
      </div>
      {hint ? <div className="tio-kpi-hint">{hint}</div> : null}
    </div>
  );
}

function KpisTerritorial({ filtros }: { filtros: Filtros }) {
  const { data, isPending, isError, refetch } = useMetricasTerritorial(filtros);

  if (isError) {
    return (
      <div
        className="tio-glass"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          color: "var(--ink-dim)",
        }}
      >
        Não foi possível carregar os indicadores.
        <button
          type="button"
          className="tio-link"
          style={{ border: "none", background: "none", cursor: "pointer", font: "inherit" }}
          onClick={() => refetch()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div className="tio-kpis" aria-busy="true" aria-label="Carregando métricas">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 74, minWidth: 148, flex: 1, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  const nichoLider = data.topNiche && isNicheId(data.topNiche.id) ? NICHE_MAP[data.topNiche.id] : null;
  const IconeLider = nichoLider?.icon;

  return (
    <div className="tio-kpis" aria-label="Indicadores executivos">
      <CartaoKpi icone={<Building2 size={13} />} rotulo="Empresas">
        {formatInt(data.total)}
      </CartaoKpi>
      <CartaoKpi icone={<CircleDollarSign size={13} />} rotulo="Faturamento">
        {formatBRLCompact(data.revenueSum)}
      </CartaoKpi>
      <CartaoKpi icone={<TrendingUp size={13} />} rotulo="Fat. médio">
        {formatBRLCompact(data.revenueAvg)}
      </CartaoKpi>
      <CartaoKpi icone={<Landmark size={13} />} rotulo="Estados">
        {formatInt(data.stateCount)}
      </CartaoKpi>
      <CartaoKpi icone={<MapIcon size={13} />} rotulo="Cidades">
        {formatInt(data.cityCount)}
      </CartaoKpi>
      <CartaoKpi icone={<Crown size={13} />} rotulo="Nichos">
        {formatInt(data.nicheCount)}
      </CartaoKpi>
      <CartaoKpi
        icone={<Contact size={13} />}
        rotulo="Com contato"
        hint={`${formatInt(data.withContact)} empresas`}
      >
        {formatPct(data.withContactPct)}
      </CartaoKpi>
      <CartaoKpi icone={<Users size={13} />} rotulo="Sócios">
        {formatInt(data.partnersTotal)}
      </CartaoKpi>
      <CartaoKpi
        icone={<MapPin size={13} />}
        rotulo="Top cidade"
        hint={data.topCity ? `${formatInt(data.topCity.count)} empresas` : undefined}
      >
        {data.topCity ? `${data.topCity.name} · ${data.topCity.uf}` : "—"}
      </CartaoKpi>
      <CartaoKpi
        icone={IconeLider ? <IconeLider size={13} /> : <Crown size={13} />}
        rotulo="Nicho líder"
        corIcone={nichoLider?.color}
        hint={data.topNiche ? `${formatInt(data.topNiche.count)} empresas` : undefined}
      >
        {nichoLider?.name ?? "—"}
      </CartaoKpi>
    </div>
  );
}

/* ------------------------------ Painel ------------------------------ */

/** Resumo humano do recorte ativo (cabeçalho do PDF exportado). */
function descreverFiltros(f: Filtros): string {
  const partes: string[] = [];
  if (f.nicheIds?.length)
    partes.push(`Nichos: ${f.nicheIds.map((n) => (isNicheId(n) ? NICHE_MAP[n].name : n)).join(", ")}`);
  if (f.states?.length) partes.push(`UF: ${f.states.join(", ")}`);
  if (f.cities?.length) partes.push(`Cidades: ${f.cities.join(", ")}`);
  if (f.search) partes.push(`Busca: "${f.search}"`);
  if (f.employeesMin !== undefined || f.employeesMax !== undefined)
    partes.push(`Funcionários: ${f.employeesMin ?? 0}–${f.employeesMax ?? "∞"}`);
  if (f.revenueRanges?.length)
    partes.push(`Faixas: ${f.revenueRanges.map((r) => REVENUE_RANGE_MAP[r]?.label ?? r).join(", ")}`);
  if (f.status?.length) partes.push(`Situação: ${f.status.join(", ")}`);
  return partes.length ? partes.join(" · ") : "Sem filtros (base completa)";
}

export function PainelTerritorial() {
  const estado = useEstadoTerritorial();
  const pontos = usePontosMapa(estado.filtros);

  // Modo-foco: as conexões vêm do DETALHE da empresa (todas), não do teto
  // global de 400 mais fortes — a consulta global pausa enquanto há foco.
  const [focoId, setFocoId] = useState<string | null>(null);
  const conexoesQuery = useConexoesTerritorial(estado.filtros, focoId === null);
  const focoDetalhe = useDetalheEmpresa(focoId);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pedidoCentro, setPedidoCentro] = useState<{ id: string; ts: number } | null>(null);
  // Os filtros são uma GAVETA lateral (como o drawer de detalhes) em toda
  // largura — decisão do Rafael: recolhidos, o hub inteiro cabe na tela.
  // A escolha sobrevive à navegação.
  const [filtrosAbertos, setFiltrosAbertosBruto] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem("febrahub:tio-filtros") === "1") setFiltrosAbertosBruto(true); } catch { /* ok */ }
  }, []);
  const setFiltrosAbertos = (v: boolean) => {
    setFiltrosAbertosBruto(v);
    try { localStorage.setItem("febrahub:tio-filtros", v ? "1" : "0"); } catch { /* ok */ }
  };
  useEffect(() => {
    if (!filtrosAbertos) return;
    const aoTecla = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltrosAbertosBruto(false); };
    window.addEventListener("keydown", aoTecla);
    return () => window.removeEventListener("keydown", aoTecla);
  }, [filtrosAbertos]);
  const [exportando, setExportando] = useState<null | "csv" | "xlsx" | "pdf">(null);
  const [avisoExport, setAvisoExport] = useState<string | null>(null);

  const conexoes = useMemo(
    () =>
      focoId
        ? (focoDetalhe.data?.connections ?? []).map((c) => c.connection)
        : (conexoesQuery.data?.connections ?? []),
    [focoId, focoDetalhe.data, conexoesQuery.data],
  );

  const focoConexoes = useMemo(() => {
    if (!focoId) return null;
    const nome =
      pontos.data?.points.find((p) => p.id === focoId)?.name ??
      focoDetalhe.data?.company.legalName ??
      "empresa";
    return { id: focoId, nome };
  }, [focoId, pontos.data, focoDetalhe.data]);

  const descricaoRecorte = useMemo(() => descreverFiltros(estado.filtros), [estado.filtros]);

  const centralizar = (id: string) => setPedidoCentro({ id, ts: Date.now() });

  const exportar = async (formato: "csv" | "xlsx" | "pdf", ids?: string[]) => {
    setExportando(formato);
    setAvisoExport(null);
    try {
      const r = await exportarEmpresas(estado.filtros);
      const dados = ids?.length ? r.data.filter((c) => ids.includes(c.id)) : r.data;
      if (formato === "csv") exportarCsv(dados);
      else if (formato === "xlsx") await exportarXlsx(dados);
      else
        await exportarPdf(
          dados,
          ids?.length ? `Seleção manual de ${dados.length} empresas` : descricaoRecorte,
        );
      if (r.truncated && !ids?.length) {
        setAvisoExport(
          `Exportados ${formatInt(r.data.length)} de ${formatInt(r.total)} registros (teto da exportação).`,
        );
      }
    } catch {
      setAvisoExport("Falha ao exportar os dados.");
    } finally {
      setExportando(null);
    }
  };

  const conteudoFiltros = <FiltrosTerritorial estado={estado} />;

  return (
    <div className="tio">
      {/* Ações do recorte: filtros (mobile) + exportação */}
      <div className="tio-topo" style={{ marginBottom: 16 }}>
        <Botao
          className="tio-botao-filtros"
          onClick={() => setFiltrosAbertos(true)}
          aria-expanded={filtrosAbertos}
        >
          <SlidersHorizontal size={14} aria-hidden /> Filtros
          {estado.ativos > 0 ? <span className="tio-badge-filtros">{estado.ativos}</span> : null}
        </Botao>
        {avisoExport ? (
          <span style={{ fontSize: 12, color: "var(--warn)" }}>{avisoExport}</span>
        ) : null}
        <div className="tio-topo-acoes">
          {(["csv", "xlsx", "pdf"] as const).map((fmt) => (
            <Botao
              key={fmt}
              variante="fantasma"
              disabled={exportando !== null}
              onClick={() => void exportar(fmt)}
              title={`Exportar o recorte em ${fmt.toUpperCase()} (documento mascarado)`}
            >
              <Download size={13} aria-hidden /> {exportando === fmt ? "Gerando…" : fmt.toUpperCase()}
            </Botao>
          ))}
        </div>
      </div>

      <div className="tio-leiaute">
        <section className="tio-conteudo">
          <div className="tio-fade-up">
            <KpisTerritorial filtros={estado.filtros} />
          </div>

          {/* O mapa NUNCA desmonta durante loading/erro (o WebGL morre):
              os estados são sobreposições dentro dele. */}
          <MapaTerritorial
            estado={estado}
            pontos={pontos.data?.points ?? []}
            carregando={pontos.isPending}
            erro={pontos.isError}
            aoTentarNovamente={() => void pontos.refetch()}
            conexoes={conexoes}
            totalConexoes={conexoesQuery.data?.total ?? conexoes.length}
            conexoesTruncadas={conexoesQuery.data?.truncated ?? false}
            semCoordenadas={pontos.data?.withoutCoordinates ?? 0}
            focoConexoes={focoConexoes}
            aoLimparFoco={() => setFocoId(null)}
            selecionada={estado.selecionada}
            aoSelecionar={estado.selecionar}
            hoverId={hoverId}
            aoPassarMouse={setHoverId}
            pedidoCentro={pedidoCentro}
          />

          <div className="tio-fade-up" style={{ animationDelay: "120ms" }}>
            <TabelaEmpresas
              estado={estado}
              aoCentralizar={centralizar}
              aoExportarSelecao={(ids, fmt) => void exportar(fmt, ids)}
              aoPassarMouse={setHoverId}
            />
          </div>
        </section>
      </div>

      {/* Bottom-sheet de filtros (mobile) */}
      {filtrosAbertos ? (
        <>
          <button
            type="button"
            className="tio-sheet-veu"
            onClick={() => setFiltrosAbertos(false)}
            aria-label="Fechar filtros"
            tabIndex={-1}
          />
          <div className="tio-sheet tio-glass-strong" role="dialog" aria-modal="true" aria-label="Filtros">
            <div className="tio-sheet-cab">
              <span className="tio-display" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                <ListFilter size={15} aria-hidden /> Filtros
                {estado.ativos > 0 ? <span className="tio-badge-filtros">{estado.ativos}</span> : null}
              </span>
              <Botao variante="fantasma" onClick={() => setFiltrosAbertos(false)}>
                Fechar
              </Botao>
            </div>
            <div className="tio-sheet-corpo">{conteudoFiltros}</div>
          </div>
        </>
      ) : null}

      <DrawerEmpresa
        id={estado.selecionada}
        aoFechar={() => estado.selecionar(null)}
        aoNavegar={(id) => estado.selecionar(id)}
        aoCentralizar={(id) => centralizar(id)}
        aoVerConexoes={(id) => {
          setFocoId(id);
          estado.mudar({ showConnections: true });
        }}
      />
    </div>
  );
}
