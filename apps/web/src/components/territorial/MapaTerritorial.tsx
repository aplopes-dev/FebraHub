"use client";

/* ============================================================
   Mapa da Inteligência Territorial — porte fiel do CompanyMap do
   aplopes-dev/hub para o FebraHub.

   Mesma arquitetura da origem: MapLibre imperativo como base
   (basemap CARTO gratuito, com fallback local silencioso se o CDN
   cair) e deck.gl como MapboxOverlay por cima — pontos coloridos por
   nicho com raio pela métrica escolhida, arcos de conexão com
   força/alfa, fronteiras estaduais, cluster (supercluster) em zoom
   baixo, legenda interativa, painel de camadas e modo-foco de
   conexões de uma empresa.

   REGRAS DE SOBREVIVÊNCIA DO WEBGL (não mexer sem ler):
   - o mapa monta UMA vez; troca de tema é setStyle (preserva câmera);
   - nunca desmonta durante loading — sobreposição por cima, mapa vivo;
   - ResizeObserver no container (o grid assenta depois do 1º paint).
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibre } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ArcLayer, GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer, PickingInfo } from "@deck.gl/core";
import { scaleSqrt } from "d3-scale";
import { Expand, Layers, Loader2, Maximize2, Minus, Plus, Shrink } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import estadosBr from "@/data/br-states.json";
import { buildClusterIndex, boundsOfPoints, type ClusterFeature } from "@/lib/territorial/geo";
import { isNicheId, nicheColorRgb } from "@/lib/territorial/nichos";
import {
  BASEMAP_STYLE_URLS,
  FALLBACK_STYLES,
  FOCUS_BOUNDS,
  MAP_LAYER_COLORS,
  type MapTheme,
} from "@/lib/territorial/mapStyle";
import type { CompanyConnection, MapPoint, SizeMode } from "@/lib/territorial/tipos";
import { formatInt } from "@/lib/territorial/formato";
import type { EstadoTerritorial } from "@/hooks/territorial";
import { usePrefsMapa } from "@/hooks/territorial";
import { Botao } from "./ui";
import { LegendaMapa } from "./LegendaMapa";
import { CamadasMapa } from "./CamadasMapa";
import { TooltipMapa, type DadosTooltip } from "./TooltipMapa";

const UFS_FOCO = new Set(["BA", "SE", "AL", "PE"]);
/** Agrupa apenas em zoom bem baixo (visão além dos 4 estados focais). */
const CLUSTER_MAX_ZOOM = 4.0;

/** Tema efetivo do app: o FebraHub grava `data-tema` no <html>. */
function useTemaMapa(): MapTheme {
  // Lê o tema JÁ NO PRIMEIRO render (lazy initializer): começar em "dark" e
  // corrigir depois disparava um setStyle extra logo no boot — o mapa nascia
  // baixando dark-matter para trocar por positron milissegundos depois.
  const [tema, setTema] = useState<MapTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const atributo = document.documentElement.getAttribute("data-tema");
    const escuro =
      atributo === "escuro" ||
      (atributo == null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return escuro ? "dark" : "light";
  });
  useEffect(() => {
    const raiz = document.documentElement;
    const ler = () => {
      const atributo = raiz.getAttribute("data-tema");
      const escuro =
        atributo === "escuro" ||
        (atributo == null && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setTema(escuro ? "dark" : "light");
    };
    ler();
    const obs = new MutationObserver(ler);
    obs.observe(raiz, { attributes: true, attributeFilter: ["data-tema"] });
    return () => obs.disconnect();
  }, []);
  return tema;
}

interface MapaTerritorialProps {
  estado: EstadoTerritorial;
  pontos: MapPoint[];
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
  conexoes: CompanyConnection[];
  totalConexoes: number;
  conexoesTruncadas: boolean;
  semCoordenadas: number;
  /** Modo-foco: só as conexões desta empresa (vindas do detalhe, sem teto). */
  focoConexoes: { id: string; nome: string } | null;
  aoLimparFoco: () => void;
  selecionada: string | null;
  aoSelecionar: (id: string | null) => void;
  hoverId: string | null;
  aoPassarMouse: (id: string | null) => void;
  pedidoCentro: { id: string; ts: number } | null;
}

export function MapaTerritorial({
  estado,
  pontos,
  carregando,
  erro,
  aoTentarNovamente,
  conexoes,
  totalConexoes,
  conexoesTruncadas,
  semCoordenadas,
  focoConexoes,
  aoLimparFoco,
  selecionada,
  aoSelecionar,
  hoverId,
  aoPassarMouse,
  pedidoCentro,
}: MapaTerritorialProps) {
  const tema = useTemaMapa();
  const temaRef = useRef(tema);
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<MapLibre | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const vigiaTemaRef = useRef<number | null>(null);

  const [pronto, setPronto] = useState(false);
  const [zoom, setZoom] = useState(5.4);
  const [carimboVista, setCarimboVista] = useState(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; dados: DadosTooltip } | null>(null);
  const [arcoHover, setArcoHover] = useState<string | null>(null);
  const [tamanho, setTamanho] = useState({ w: 800, h: 520 });
  const [cheia, setCheia] = useState(false);
  const [camadasAbertas, setCamadasAbertas] = useState(false);

  /* Estado das camadas: pontos/ocultos são voláteis; métrica, cluster e
     fronteiras sobrevivem ao F5 (localStorage, como o "ti-prefs" do hub). */
  const [prefs, mudarPrefs] = usePrefsMapa();
  const [mostrarPontos, setMostrarPontos] = useState(true);
  const [nichosOcultos, setNichosOcultos] = useState<string[]>([]);
  const alternarOculto = useCallback(
    (id: string) =>
      setNichosOcultos((atual) =>
        atual.includes(id) ? atual.filter((n) => n !== id) : [...atual, id],
      ),
    [],
  );

  /* ---------------- mapa base (monta UMA vez) ---------------- */
  useEffect(() => {
    if (!containerRef.current || mapaRef.current) return;
    const mapa = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE_URLS[temaRef.current],
      bounds: FOCUS_BOUNDS,
      fitBoundsOptions: { padding: 40 },
      minZoom: 3,
      maxZoom: 15,
      attributionControl: { compact: true },
      // Sem isto o canvas WebGL sai preto em captura de tela e na futura
      // exportação de imagem do mapa. Custo de desempenho irrelevante aqui.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    // O grid da página assenta DEPOIS da montagem (fontes, sidebar, scrollbar):
    // sem observar o container, o canvas congela no tamanho do primeiro paint.
    const observador = new ResizeObserver(() => {
      mapa.resize();
      const el = containerRef.current;
      if (el) setTamanho({ w: el.clientWidth, h: el.clientHeight });
    });
    observador.observe(containerRef.current);
    // CDN fora do ar não pode derrubar o painel: estilo local de emergência,
    // aplicado em silêncio (sem mensagem técnica, pontos e conexões ficam).
    // diff:false em TODA troca de estilo: o diff incremental sobre um estilo
    // que ainda estava carregando deixava o style manager preso num estado
    // que nunca vira "loaded" — sem tiles, sem 'load', sem 'idle'.
    const vigia = window.setTimeout(() => {
      if (!mapa.isStyleLoaded()) {
        mapa.setStyle(FALLBACK_STYLES[temaRef.current], { diff: false });
      }
    }, 8000);
    // Cinto do veil: aconteça o que acontecer com o basemap, a interface
    // destrava — pontos e fronteiras são deck.gl e não dependem do 'load'.
    const cintoVeu = window.setTimeout(() => setPronto(true), 12000);
    mapa.on("error", (e: unknown) => {
      const erro = (e as { error?: { status?: number; message?: string } }).error;
      console.warn("[mapa] erro do basemap:", erro?.status, erro?.message);
      if (erro?.status && erro.status >= 400 && !mapa.isStyleLoaded()) {
        mapa.setStyle(FALLBACK_STYLES[temaRef.current], { diff: false });
      }
    });
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    mapa.addControl(overlay);
    mapa.on("load", () => setPronto(true));
    // Cinto de segurança do 'load': com o container ainda sem altura no
    // primeiro paint (o bug do CSS do MapLibre vencendo o nosso), o load
    // podia nunca disparar — 'idle' dispara assim que o render assenta.
    mapa.once("idle", () => setPronto(true));
    mapa.on("zoom", () => setZoom(mapa.getZoom()));
    const carimbar = () => setCarimboVista((v) => v + 1);
    mapa.on("moveend", carimbar);
    mapa.on("zoomend", carimbar);
    mapa.on("movestart", () => setTooltip(null));
    mapaRef.current = mapa;
    overlayRef.current = overlay;
    return () => {
      clearTimeout(vigia);
      clearTimeout(cintoVeu);
      observador.disconnect();
      overlayRef.current = null;
      mapaRef.current = null;
      mapa.remove();
    };
    // O tema troca via setStyle no efeito abaixo — recriar o mapa perderia a câmera.
  }, []);

  /* ---------------- tema claro/escuro ----------------
     setStyle preserva a câmera; as camadas deck.gl vivem em canvas próprio.
     Se o estilo remoto do NOVO tema não carregar em 8s (ou der erro), cai no
     estilo local do tema, em silêncio — sem remover pontos nem conexões. */
  useEffect(() => {
    const anterior = temaRef.current;
    temaRef.current = tema;
    const mapa = mapaRef.current;
    if (!mapa || anterior === tema) return;
    mapa.setStyle(BASEMAP_STYLE_URLS[tema], { diff: false });
    if (vigiaTemaRef.current) window.clearTimeout(vigiaTemaRef.current);
    vigiaTemaRef.current = window.setTimeout(() => {
      if (mapaRef.current === mapa && !mapa.isStyleLoaded()) {
        mapa.setStyle(FALLBACK_STYLES[tema], { diff: false });
      }
    }, 8000);
    return () => {
      if (vigiaTemaRef.current) window.clearTimeout(vigiaTemaRef.current);
    };
  }, [tema]);

  /* ---------------- pontos visíveis / índices ---------------- */
  const pontosVisiveis = useMemo(
    () => pontos.filter((p) => !nichosOcultos.includes(p.nicheId)),
    [pontos, nichosOcultos],
  );
  const porId = useMemo(() => {
    const m = new Map<string, MapPoint>();
    for (const p of pontosVisiveis) m.set(p.id, p);
    return m;
  }, [pontosVisiveis]);

  const conexoesVisiveis = useMemo(
    () => conexoes.filter((k) => porId.has(k.sourceCompanyId) && porId.has(k.targetCompanyId)),
    [conexoes, porId],
  );

  /* ---------------- enquadramento ---------------- */
  const enquadrar = useCallback(
    (animar: boolean) => {
      const mapa = mapaRef.current;
      if (!mapa || pontosVisiveis.length === 0) return;
      const b = boundsOfPoints(pontosVisiveis);
      if (!b) return;
      mapa.fitBounds(b as [[number, number], [number, number]], {
        padding: { top: 56, bottom: 56, left: 56, right: 56 },
        duration: animar ? 850 : 0,
        maxZoom: 9.6,
      });
    },
    [pontosVisiveis],
  );

  // Reenquadra quando o recorte ESTRUTURAL muda (nicho/UF/cidade) — o primeiro
  // enquadramento é imediato; os seguintes têm transição suave.
  const assinaturaEstrutural = useMemo(
    () =>
      JSON.stringify([
        [...(estado.filtros.nicheIds ?? [])].sort(),
        [...(estado.filtros.states ?? [])].sort(),
        [...(estado.filtros.cities ?? [])].sort(),
      ]),
    [estado.filtros.nicheIds, estado.filtros.states, estado.filtros.cities],
  );
  const assinaturaAnterior = useRef("");
  useEffect(() => {
    if (!pronto || carregando || pontosVisiveis.length === 0) return;
    if (assinaturaEstrutural === assinaturaAnterior.current) return;
    const ehPrimeira = assinaturaAnterior.current === "";
    assinaturaAnterior.current = assinaturaEstrutural;
    enquadrar(!ehPrimeira);
  }, [assinaturaEstrutural, pronto, carregando, pontosVisiveis.length, enquadrar]);

  // Pedido de centralização (tabela / drawer).
  useEffect(() => {
    if (!pedidoCentro) return;
    const mapa = mapaRef.current;
    const p = pontos.find((pt) => pt.id === pedidoCentro.id);
    if (!mapa || !p) return;
    mapa.flyTo({ center: p.position, zoom: Math.max(mapa.getZoom(), 9.4), duration: 900, essential: true });
  }, [pedidoCentro, pontos]);

  /* ---------------- clusters ---------------- */
  const modoCluster = prefs.clusterEnabled && zoom < CLUSTER_MAX_ZOOM;
  const indice = useMemo(
    () => (modoCluster && pontosVisiveis.length > 0 ? buildClusterIndex(pontosVisiveis) : null),
    [modoCluster, pontosVisiveis],
  );
  const gruposCluster = useMemo(() => {
    if (!modoCluster || !indice || !mapaRef.current) return null;
    const b = mapaRef.current.getBounds();
    return indice.getClusters(
      [b.getWest() - 1, b.getSouth() - 1, b.getEast() + 1, b.getNorth() + 1],
      zoom,
    );
    // carimboVista força recomputar após pan/zoom.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoCluster, indice, zoom, carimboVista]);

  /* ---------------- raio por métrica ---------------- */
  const raioDe = useMemo(() => {
    const metrica = (p: MapPoint) =>
      prefs.sizeMode === "revenue"
        ? p.revenue
        : prefs.sizeMode === "employees"
          ? p.employeeCount
          : prefs.sizeMode === "score"
            ? p.score
            : 1;
    if (prefs.sizeMode === "uniform") return () => 6;
    let min = Infinity;
    let max = -Infinity;
    for (const p of pontosVisiveis) {
      const v = metrica(p);
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!Number.isFinite(min) || min === max) return () => 5;
    const escala = scaleSqrt().domain([min, max]).range([2.6, 11]);
    return (p: MapPoint) => escala(metrica(p));
  }, [pontosVisiveis, prefs.sizeMode]);

  /** Teto de arcos no zoom atual (foco em conexões relevantes). */
  const tetoArcos = focoConexoes
    ? conexoesVisiveis.length
    : zoom < 6
      ? 120
      : zoom < 8
        ? 250
        : conexoesVisiveis.length;

  /* ---------------- interações deck.gl ---------------- */
  const aoPairar = useCallback(
    (info: PickingInfo) => {
      const idCamada = info.layer?.id;
      if (!info.object) {
        setTooltip(null);
        setArcoHover(null);
        aoPassarMouse(null);
        return;
      }
      if (idCamada === "empresas" || idCamada === "folhas") {
        const p = (idCamada === "folhas"
          ? (info.object as ClusterFeature).point
          : (info.object as MapPoint)) as MapPoint | undefined;
        if (!p) return;
        setTooltip({ x: info.x, y: info.y, dados: { kind: "ponto", point: p } });
        setArcoHover(null);
        aoPassarMouse(p.id);
      } else if (idCamada === "clusters") {
        const f = info.object as ClusterFeature;
        setTooltip({ x: info.x, y: info.y, dados: { kind: "cluster", count: f.count } });
      } else if (idCamada === "conexoes") {
        const k = info.object as CompanyConnection;
        setArcoHover(k.id);
        setTooltip({
          x: info.x,
          y: info.y,
          dados: {
            kind: "arco",
            connection: k,
            sourceName: porId.get(k.sourceCompanyId)?.name ?? k.sourceCompanyId,
            targetName: porId.get(k.targetCompanyId)?.name ?? k.targetCompanyId,
          },
        });
      }
    },
    [porId, aoPassarMouse],
  );

  const aoClicar = useCallback(
    (info: PickingInfo) => {
      const idCamada = info.layer?.id;
      if (!info.object) return;
      if (idCamada === "empresas" || idCamada === "folhas") {
        const p = (idCamada === "folhas"
          ? (info.object as ClusterFeature).point
          : (info.object as MapPoint)) as MapPoint | undefined;
        if (!p) return;
        aoSelecionar(p.id);
        mapaRef.current?.easeTo({ center: p.position, duration: 550 });
      } else if (idCamada === "clusters") {
        const f = info.object as ClusterFeature;
        if (f.clusterId !== undefined && indice) {
          mapaRef.current?.easeTo({
            center: f.position,
            zoom: indice.getExpansionZoom(f.clusterId),
            duration: 600,
          });
        }
      }
    },
    [aoSelecionar, indice],
  );

  /* ---------------- camadas ---------------- */
  const camadas = useMemo<Layer[]>(() => {
    const cores = MAP_LAYER_COLORS[tema];
    const corDe = (nicheId: string, alpha = 235): [number, number, number, number] =>
      isNicheId(nicheId) ? nicheColorRgb(nicheId, alpha) : [148, 163, 184, alpha];
    const saida: Layer[] = [];
    const geo = estadosBr as GeoJSON.FeatureCollection;

    // Estados fora do foco: véu leve — o país continua visível/navegável.
    saida.push(
      new GeoJsonLayer({
        id: "estados-veu",
        data: {
          ...geo,
          features: geo.features.filter(
            (f) => !UFS_FOCO.has((f.properties as { sigla?: string })?.sigla ?? ""),
          ),
        } as never,
        stroked: true,
        filled: true,
        getFillColor: cores.dimFill,
        getLineColor: cores.dimLine,
        lineWidthMinPixels: 0.6,
        pickable: false,
      }),
    );
    if (prefs.showBorders) {
      saida.push(
        new GeoJsonLayer({
          id: "estados-foco",
          data: {
            ...geo,
            features: geo.features.filter((f) =>
              UFS_FOCO.has((f.properties as { sigla?: string })?.sigla ?? ""),
            ),
          } as never,
          stroked: true,
          filled: true,
          getFillColor: cores.focusFill,
          getLineColor: cores.focusLine,
          lineWidthMinPixels: 1.2,
          pickable: false,
        }),
      );
    }

    // Em modo cluster os arcos são ocultados: ligariam pontos não exibidos
    // individualmente e comprometeriam a leitura (teia ilegível).
    if (estado.filtros.showConnections && conexoesVisiveis.length > 0 && !modoCluster) {
      const recortadas = conexoesVisiveis.slice(0, tetoArcos);
      saida.push(
        new ArcLayer<CompanyConnection>({
          id: "conexoes",
          data: recortadas,
          getSourcePosition: (k) => porId.get(k.sourceCompanyId)?.position ?? [0, 0],
          getTargetPosition: (k) => porId.get(k.targetCompanyId)?.position ?? [0, 0],
          getSourceColor: (k) => {
            const foco = arcoHover === k.id || focoConexoes !== null;
            return corDe(
              k.nicheId,
              foco ? cores.arcFocusAlpha : cores.arcSourceFloor + Math.round(k.strength * cores.arcSourceGain),
            );
          },
          getTargetColor: (k) => {
            const foco = arcoHover === k.id || focoConexoes !== null;
            return corDe(
              k.nicheId,
              foco ? cores.arcFocusAlpha : cores.arcTargetFloor + Math.round(k.strength * cores.arcTargetGain),
            );
          },
          getWidth: (k) => (arcoHover === k.id ? 3 : 0.9 + k.strength * 1.2),
          getHeight: 0.3,
          widthMinPixels: 1.2,
          pickable: true,
          updateTriggers: {
            getSourceColor: [arcoHover, focoConexoes?.id, tema],
            getTargetColor: [arcoHover, focoConexoes?.id, tema],
            getWidth: [arcoHover],
          },
          transitions: { getWidth: 200 },
        }),
      );
    }

    if (mostrarPontos) {
      if (modoCluster && gruposCluster) {
        const nos = gruposCluster.filter((g) => g.isCluster);
        const folhas = gruposCluster.filter((g) => !g.isCluster);
        saida.push(
          new ScatterplotLayer<ClusterFeature>({
            id: "folhas",
            data: folhas,
            getPosition: (d) => d.position,
            getRadius: (d) => (d.point ? raioDe(d.point) : 4),
            radiusUnits: "pixels",
            getFillColor: (d) => corDe(d.point?.nicheId ?? "outros", 210),
            stroked: true,
            getLineColor: cores.leafStroke,
            getLineWidth: 1,
            lineWidthUnits: "pixels",
            pickable: true,
            transitions: { getRadius: 300 },
            updateTriggers: { getRadius: [prefs.sizeMode] },
          }),
          new ScatterplotLayer<ClusterFeature>({
            id: "clusters",
            data: nos,
            getPosition: (d) => d.position,
            getRadius: (d) => 13 + Math.sqrt(d.count) * 2.4,
            radiusUnits: "pixels",
            getFillColor: cores.clusterFill,
            stroked: true,
            getLineColor: cores.clusterLine,
            getLineWidth: 1.6,
            lineWidthUnits: "pixels",
            pickable: true,
            transitions: { getRadius: 250 },
          }),
          new TextLayer<ClusterFeature>({
            id: "cluster-contagem",
            data: nos,
            getPosition: (d) => d.position,
            getText: (d) => String(d.count),
            getSize: 12.5,
            getColor: cores.clusterText,
            fontFamily: "Manrope, Inter, system-ui, sans-serif",
            fontWeight: 600,
            pickable: false,
          }),
        );
      } else {
        saida.push(
          new ScatterplotLayer<MapPoint>({
            id: "empresas",
            data: pontosVisiveis,
            getPosition: (d) => d.position,
            getRadius: (d) => {
              const base = raioDe(d);
              return d.id === hoverId || d.id === selecionada ? base * 1.25 : base;
            },
            radiusUnits: "pixels",
            getFillColor: (d) => corDe(d.nicheId, 196),
            stroked: true,
            getLineColor: (d) =>
              d.id === selecionada
                ? cores.pointStrokeSelected
                : d.id === hoverId
                  ? cores.pointStrokeHover
                  : cores.pointStroke,
            getLineWidth: (d) => (d.id === selecionada ? 2.2 : 1),
            lineWidthUnits: "pixels",
            pickable: true,
            transitions: { getRadius: 260 },
            updateTriggers: {
              getRadius: [prefs.sizeMode, hoverId, selecionada],
              getLineColor: [hoverId, selecionada, tema],
              getLineWidth: [selecionada],
            },
          }),
        );

        const destaque = [selecionada, hoverId]
          .filter((id): id is string => id !== null)
          .map((id) => porId.get(id))
          .filter((p): p is MapPoint => p !== undefined);
        if (destaque.length > 0) {
          saida.push(
            new ScatterplotLayer<MapPoint>({
              id: "anel-destaque",
              data: destaque,
              getPosition: (d) => d.position,
              getRadius: (d) => raioDe(d) * 1.25 + 6,
              radiusUnits: "pixels",
              stroked: true,
              filled: false,
              getLineColor: (d) => corDe(d.nicheId, 200),
              getLineWidth: 1.6,
              lineWidthUnits: "pixels",
              pickable: false,
              updateTriggers: { getRadius: [prefs.sizeMode] },
            }),
          );
        }
      }
    }

    return saida;
  }, [
    tema,
    prefs.showBorders,
    prefs.sizeMode,
    estado.filtros.showConnections,
    conexoesVisiveis,
    modoCluster,
    tetoArcos,
    porId,
    arcoHover,
    focoConexoes,
    mostrarPontos,
    gruposCluster,
    pontosVisiveis,
    raioDe,
    hoverId,
    selecionada,
  ]);

  useEffect(() => {
    overlayRef.current?.setProps({
      layers: camadas,
      onHover: aoPairar,
      onClick: aoClicar,
      pickingRadius: 6,
      getCursor: ({ isHovering }: { isHovering: boolean }) => (isHovering ? "pointer" : "grab"),
    });
  }, [camadas, aoPairar, aoClicar]);

  /* ---------------- tela cheia ---------------- */
  const alternarCheia = useCallback(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;
    if (!document.fullscreenElement && !cheia) {
      (caixa.requestFullscreen?.() ?? Promise.reject()).catch(() => setCheia(true));
    } else if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      setCheia(false);
    }
  }, [cheia]);
  useEffect(() => {
    const aoMudar = () => setCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);
  useEffect(() => {
    if (!cheia || document.fullscreenElement) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setCheia(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [cheia]);
  // Recalcula o canvas ao entrar/sair da tela cheia (evita tiles cortados).
  useEffect(() => {
    const timers = [80, 360].map((ms) => window.setTimeout(() => mapaRef.current?.resize(), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [cheia]);

  /* ---------------- render ---------------- */
  const semResultados = !carregando && !erro && pontos.length === 0 && pronto;

  return (
    <div
      ref={caixaRef}
      className={`tio-mapa-moldura tio-glass${cheia ? "" : " tio-edge-glow"}`}
      data-cheia={cheia ? "1" : undefined}
      data-testid="mapa-territorial"
    >
      <div
        ref={containerRef}
        className="tio-mapa-canvas"
        role="application"
        aria-label="Mapa interativo de empresas"
      />

      {tooltip ? (
        <TooltipMapa
          x={tooltip.x}
          y={tooltip.y}
          larguraContainer={tamanho.w}
          alturaContainer={tamanho.h}
          dados={tooltip.dados}
        />
      ) : null}

      {/* Controles de zoom/enquadramento/camadas */}
      <div className="tio-mapa-controles">
        <button
          type="button"
          className="tio-mapa-btn tio-glass"
          onClick={alternarCheia}
          aria-label={cheia ? "Fechar tela cheia" : "Expandir mapa"}
          aria-pressed={cheia}
          title={cheia ? "Fechar tela cheia (Esc)" : "Expandir mapa"}
        >
          {cheia ? <Shrink size={15} /> : <Expand size={15} />}
        </button>
        <button
          type="button"
          className="tio-mapa-btn tio-glass"
          onClick={() => mapaRef.current?.zoomIn({ duration: 250 })}
          aria-label="Aproximar"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          className="tio-mapa-btn tio-glass"
          onClick={() => mapaRef.current?.zoomOut({ duration: 250 })}
          aria-label="Afastar"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          className="tio-mapa-btn tio-glass"
          onClick={() => enquadrar(true)}
          aria-label="Enquadrar resultados"
          title="Enquadrar resultados"
        >
          <Maximize2 size={15} />
        </button>
        <button
          type="button"
          className="tio-mapa-btn tio-glass"
          onClick={() => setCamadasAbertas(!camadasAbertas)}
          aria-label="Camadas do mapa"
          aria-expanded={camadasAbertas}
          title="Camadas"
        >
          <Layers size={15} />
        </button>
      </div>

      {/* Painel de camadas */}
      {camadasAbertas ? (
        <CamadasMapa
          estado={estado}
          aoFechar={() => setCamadasAbertas(false)}
          mostrarPontos={mostrarPontos}
          setMostrarPontos={setMostrarPontos}
          agrupar={prefs.clusterEnabled}
          setAgrupar={(v) => mudarPrefs({ clusterEnabled: v })}
          fronteiras={prefs.showBorders}
          setFronteiras={(v) => mudarPrefs({ showBorders: v })}
          modoTamanho={prefs.sizeMode as SizeMode}
          setModoTamanho={(m) => mudarPrefs({ sizeMode: m })}
        />
      ) : null}

      {/* Legenda flutuante (some abaixo de 768px via CSS) */}
      <LegendaMapa estado={estado} nichosOcultos={nichosOcultos} alternarOculto={alternarOculto} />

      {/* Chips de status do mapa */}
      <div className="tio-mapa-chips">
        {semCoordenadas > 0 ? (
          <span
            className="tio-mapa-chip tio-glass"
            title="Empresas sem latitude/longitude não aparecem no mapa"
          >
            {formatInt(semCoordenadas)} sem coordenadas
          </span>
        ) : null}
        {estado.filtros.showConnections &&
        !modoCluster &&
        !focoConexoes &&
        (conexoesTruncadas || tetoArcos < conexoesVisiveis.length) ? (
          <span className="tio-mapa-chip tio-glass">
            {formatInt(Math.min(tetoArcos, conexoesVisiveis.length))} conexões mais fortes de{" "}
            {formatInt(Math.max(totalConexoes, conexoesVisiveis.length))} — aproxime para ver mais
          </span>
        ) : null}
        {focoConexoes ? (
          <button type="button" className="tio-mapa-chip-acao tio-glass" onClick={aoLimparFoco}>
            Conexões de {focoConexoes.nome} — limpar ×
          </button>
        ) : null}
      </div>

      {/* Estados de carregamento / erro / vazio — POR CIMA do mapa vivo */}
      {(!pronto || (carregando && pontos.length === 0)) && !erro ? (
        <div className="tio-mapa-veu" aria-busy="true" aria-label="Carregando mapa">
          <div
            className="tio-glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--ink-dim)",
            }}
          >
            <Loader2 size={16} className="tio-girar" style={{ color: "var(--accent-2)" }} aria-hidden />
            Carregando mapa e empresas…
          </div>
        </div>
      ) : null}

      {erro ? (
        <div className="tio-mapa-veu">
          <div className="tio-mapa-aviso tio-glass-strong">
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink)" }}>
              Não foi possível carregar as empresas do mapa.
            </p>
            <Botao variante="primario" style={{ marginTop: 12 }} onClick={aoTentarNovamente}>
              Tentar novamente
            </Botao>
          </div>
        </div>
      ) : null}

      {semResultados ? (
        <div className="tio-mapa-veu" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="tio-mapa-aviso tio-glass-strong">
            <p className="tio-display" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
              Nenhum resultado
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink-dim)" }}>
              Os filtros atuais não retornaram empresas com coordenadas.
            </p>
            <Botao style={{ marginTop: 12 }} onClick={estado.limpar}>
              Limpar filtros
            </Botao>
          </div>
        </div>
      ) : null}
    </div>
  );
}
