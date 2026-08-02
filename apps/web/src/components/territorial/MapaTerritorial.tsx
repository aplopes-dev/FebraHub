"use client";

/* ============================================================
   Mapa da Inteligência Territorial — porte do CompanyMap do
   aplopes-dev/hub para o FebraHub.

   Mesma arquitetura da origem: MapLibre imperativo como base
   (basemap CARTO gratuito, com fallback local se o CDN cair) e
   deck.gl como MapboxOverlay por cima — pontos coloridos por nicho,
   arcos de conexão com força/alfa, fronteiras estaduais e cluster
   (supercluster) quando o zoom afasta além dos 4 estados focais.
   O que ficou de fora do porte (e por quê) está em
   docs/INTEGRACAO_HUB_CRM.md.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibre } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ArcLayer, GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { Layer, PickingInfo } from "@deck.gl/core";
import { scaleSqrt } from "d3-scale";
import { Crosshair, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import estadosBr from "@/data/br-states.json";
import { buildClusterIndex, boundsOfPoints, padBounds, type ClusterFeature } from "@/lib/territorial/geo";
import { isNicheId, nicheColorRgb, NICHE_MAP } from "@/lib/territorial/nichos";
import {
  BASEMAP_STYLE_URLS,
  FALLBACK_STYLES,
  FOCUS_BOUNDS,
  MAP_LAYER_COLORS,
  type MapTheme,
} from "@/lib/territorial/mapStyle";
import type { CompanyConnection, MapPoint } from "@/lib/territorial/tipos";
import { C } from "@/lib/tema";

const UFS_FOCO = new Set(["BA", "SE", "AL", "PE"]);

/** Tema efetivo do app: o FebraHub grava `data-tema` no <html>. */
function useTemaMapa(): MapTheme {
  const [tema, setTema] = useState<MapTheme>("dark");
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

interface Tooltip {
  x: number;
  y: number;
  titulo: string;
  linhas: string[];
}

export function MapaTerritorial({
  pontos,
  conexoes,
  selecionada,
  aoSelecionar,
  semCoordenadas,
  conexoesTruncadas,
}: {
  pontos: MapPoint[];
  conexoes: CompanyConnection[];
  selecionada: string | null;
  aoSelecionar: (id: string | null) => void;
  semCoordenadas: number;
  conexoesTruncadas: boolean;
}) {
  const tema = useTemaMapa();
  const caixaRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<MapLibre | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [pronto, setPronto] = useState(false);
  const [zoom, setZoom] = useState(5);
  const [hover, setHover] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [cheia, setCheia] = useState(false);

  /* ---------------- mapa base ---------------- */
  useEffect(() => {
    if (!containerRef.current || mapaRef.current) return;
    const mapa = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE_URLS[tema],
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
    // sem observar o container, o canvas congela no tamanho do primeiro paint
    // — foi exatamente o bug do primeiro deploy (canvas 400px num shell de 657).
    const observador = new ResizeObserver(() => mapa.resize());
    observador.observe(containerRef.current);
    // CDN fora do ar não pode derrubar o painel: estilo local de emergência.
    const vigia = setTimeout(() => {
      if (!mapa.isStyleLoaded()) mapa.setStyle(FALLBACK_STYLES[tema]);
    }, 8000);
    mapa.on("error", (e: unknown) => {
      const status = (e as { error?: { status?: number } }).error?.status;
      if (status && status >= 400) mapa.setStyle(FALLBACK_STYLES[tema]);
    });
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    mapa.addControl(overlay);
    mapa.on("load", () => setPronto(true));
    mapa.on("zoom", () => setZoom(mapa.getZoom()));
    mapaRef.current = mapa;
    overlayRef.current = overlay;
    return () => {
      clearTimeout(vigia);
      observador.disconnect();
      overlayRef.current = null;
      mapaRef.current = null;
      mapa.remove();
    };
    // O tema troca via setStyle no efeito abaixo — recriar o mapa perderia a câmera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !pronto) return;
    mapa.setStyle(BASEMAP_STYLE_URLS[tema]);
  }, [tema, pronto]);

  /* ---------------- enquadramento por recorte ---------------- */
  const assinatura = useMemo(
    () => pontos.length + ":" + (pontos[0]?.id ?? "") + ":" + (pontos[pontos.length - 1]?.id ?? ""),
    [pontos]
  );
  const assinaturaAnterior = useRef("");
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !pronto || !pontos.length) return;
    if (assinatura === assinaturaAnterior.current) return;
    assinaturaAnterior.current = assinatura;
    const bounds = boundsOfPoints(pontos);
    if (bounds) mapa.fitBounds(padBounds(bounds, 0.2), { padding: 40, duration: 700, maxZoom: 11 });
  }, [assinatura, pontos, pronto]);

  /* ---------------- camadas deck.gl ---------------- */
  const porId = useMemo(() => new Map(pontos.map((p) => [p.id, p])), [pontos]);
  const agrupar = zoom < 4 && pontos.length > 300;
  const indice = useMemo(() => (agrupar ? buildClusterIndex(pontos) : null), [agrupar, pontos]);
  const raio = useMemo(() => scaleSqrt().domain([0, 100]).range([2.6, 9]), []);

  const camadas = useMemo<Layer[]>(() => {
    const cores = MAP_LAYER_COLORS[tema];
    const corDe = (nicheId: string, alpha = 235): [number, number, number, number] =>
      isNicheId(nicheId) ? nicheColorRgb(nicheId, alpha) : [148, 163, 184, alpha];

    const estados = new GeoJsonLayer({
      id: "estados",
      data: estadosBr as never,
      stroked: true,
      filled: true,
      getFillColor: (f: { properties?: { sigla?: string } }) =>
        UFS_FOCO.has(f.properties?.sigla ?? "") ? cores.focusFill : cores.dimFill,
      getLineColor: (f: { properties?: { sigla?: string } }) =>
        UFS_FOCO.has(f.properties?.sigla ?? "") ? cores.focusLine : cores.dimLine,
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      pickable: false,
    });

    if (agrupar && indice) {
      const grupos = indice.getClusters([-75, -34, -32, 6], zoom);
      const folhas = grupos.filter((g) => !g.isCluster);
      const nos = grupos.filter((g) => g.isCluster);
      return [
        estados,
        new ScatterplotLayer<ClusterFeature>({
          id: "folhas",
          data: folhas,
          getPosition: (d) => d.position,
          getRadius: 3.4,
          radiusUnits: "pixels",
          getFillColor: (d) => corDe(d.point?.nicheId ?? "outros"),
          stroked: true,
          getLineColor: cores.leafStroke,
          getLineWidth: 1,
          lineWidthUnits: "pixels",
          pickable: true,
        }),
        new ScatterplotLayer<ClusterFeature>({
          id: "clusters",
          data: nos,
          getPosition: (d) => d.position,
          getRadius: (d) => 12 + Math.min(Math.sqrt(d.count) * 2.4, 22),
          radiusUnits: "pixels",
          getFillColor: cores.clusterFill,
          stroked: true,
          getLineColor: cores.clusterLine,
          getLineWidth: 1.4,
          lineWidthUnits: "pixels",
          pickable: true,
        }),
        new TextLayer<ClusterFeature>({
          id: "cluster-contagem",
          data: nos,
          getPosition: (d) => d.position,
          getText: (d) => String(d.count),
          getSize: 13,
          getColor: cores.clusterText,
          fontFamily: "Manrope, sans-serif",
          fontWeight: 700,
          pickable: false,
        }),
      ];
    }

    const arcosVisiveis = zoom < 6 ? conexoes.slice(0, 120) : zoom < 8 ? conexoes.slice(0, 250) : conexoes;
    const arcos = new ArcLayer<CompanyConnection>({
      id: "conexoes",
      data: arcosVisiveis.filter((k) => porId.has(k.sourceCompanyId) && porId.has(k.targetCompanyId)),
      getSourcePosition: (d) => porId.get(d.sourceCompanyId)!.position,
      getTargetPosition: (d) => porId.get(d.targetCompanyId)!.position,
      getSourceColor: (d) => corDe(d.nicheId, cores.arcSourceFloor + d.strength * cores.arcSourceGain),
      getTargetColor: (d) => corDe(d.nicheId, cores.arcTargetFloor + d.strength * cores.arcTargetGain),
      getWidth: (d) => 0.9 + d.strength * 1.2,
      getHeight: 0.3,
      pickable: true,
    });

    const empresas = new ScatterplotLayer<MapPoint>({
      id: "empresas",
      data: pontos,
      getPosition: (d) => d.position,
      getRadius: (d) => raio(d.score) * (d.id === selecionada ? 1.35 : 1),
      radiusUnits: "pixels",
      getFillColor: (d) => corDe(d.nicheId, d.id === hover || d.id === selecionada ? 255 : 215),
      stroked: true,
      getLineColor: (d) =>
        d.id === selecionada
          ? cores.pointStrokeSelected
          : d.id === hover
            ? cores.pointStrokeHover
            : cores.pointStroke,
      getLineWidth: (d) => (d.id === selecionada ? 2 : 1),
      lineWidthUnits: "pixels",
      pickable: true,
      updateTriggers: {
        getFillColor: [hover, selecionada],
        getLineColor: [hover, selecionada],
        getRadius: [selecionada],
      },
    });

    const anel = selecionada && porId.get(selecionada)
      ? [
          new ScatterplotLayer<MapPoint>({
            id: "anel",
            data: [porId.get(selecionada)!],
            getPosition: (d) => d.position,
            getRadius: (d) => raio(d.score) * 2.2,
            radiusUnits: "pixels",
            filled: false,
            stroked: true,
            getLineColor: cores.pointStrokeSelected,
            getLineWidth: 1.4,
            lineWidthUnits: "pixels",
            pickable: false,
          }),
        ]
      : [];

    return [estados, arcos, empresas, ...anel];
  }, [tema, agrupar, indice, zoom, conexoes, pontos, porId, raio, hover, selecionada]);

  useEffect(() => {
    overlayRef.current?.setProps({
      layers: camadas,
      onHover: (info: PickingInfo) => {
        const objeto = info.object as MapPoint | ClusterFeature | CompanyConnection | undefined;
        if (!objeto) {
          setHover(null);
          setTooltip(null);
          return;
        }
        if ("position" in objeto && "nicheId" in objeto && "score" in objeto) {
          const p = objeto as MapPoint;
          setHover(p.id);
          setTooltip({
            x: info.x, y: info.y, titulo: p.name,
            linhas: [
              `${p.city} · ${p.state}`,
              isNicheId(p.nicheId) ? NICHE_MAP[p.nicheId].name : p.nicheId,
              `${p.partnersCount} ${p.partnersCount === 1 ? "sócio" : "sócios"} · relevância ${p.score}`,
            ],
          });
        } else if ("isCluster" in objeto && objeto.isCluster) {
          setTooltip({ x: info.x, y: info.y, titulo: `${objeto.count} empresas`, linhas: ["Clique para aproximar"] });
        } else if ("strength" in objeto) {
          const k = objeto as CompanyConnection;
          const a = porId.get(k.sourceCompanyId)?.name ?? k.sourceCompanyId;
          const b = porId.get(k.targetCompanyId)?.name ?? k.targetCompanyId;
          setTooltip({
            x: info.x, y: info.y, titulo: `${a} ↔ ${b}`,
            linhas: [k.metadata.label ?? k.type, `força ${(k.strength * 100).toFixed(0)}%`],
          });
        }
      },
      onClick: (info: PickingInfo) => {
        const objeto = info.object as MapPoint | ClusterFeature | undefined;
        if (!objeto) {
          aoSelecionar(null);
          return;
        }
        if ("isCluster" in objeto && objeto.isCluster && objeto.clusterId != null && indice) {
          mapaRef.current?.easeTo({
            center: objeto.position,
            zoom: indice.getExpansionZoom(objeto.clusterId),
            duration: 500,
          });
          return;
        }
        if ("nicheId" in objeto && "score" in objeto) {
          aoSelecionar((objeto as MapPoint).id);
          mapaRef.current?.easeTo({ center: (objeto as MapPoint).position, duration: 450 });
        }
      },
    });
  }, [camadas, aoSelecionar, indice, porId]);

  /* ---------------- tela cheia ---------------- */
  const alternarCheia = useCallback(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;
    if (!document.fullscreenElement) {
      (caixa.requestFullscreen?.() ?? Promise.reject()).catch(() => setCheia(true));
    } else {
      void document.exitFullscreen();
    }
  }, []);
  useEffect(() => {
    const aoMudar = () => {
      setCheia(!!document.fullscreenElement);
      setTimeout(() => mapaRef.current?.resize(), 120);
    };
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);
  useEffect(() => {
    if (!cheia || document.fullscreenElement) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setCheia(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [cheia]);
  useEffect(() => {
    const t = setTimeout(() => mapaRef.current?.resize(), 120);
    return () => clearTimeout(t);
  }, [cheia]);

  const enquadrar = () => {
    const bounds = boundsOfPoints(pontos);
    if (bounds) mapaRef.current?.fitBounds(padBounds(bounds, 0.2), { padding: 40, duration: 600 });
  };

  const botao: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.cardLine}`,
    background: C.card, color: C.muted, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer",
  };

  return (
    <div ref={caixaRef} className={`fh-terr-mapa${cheia ? " fh-terr-mapa-cheia" : ""}`}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* controles */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "grid", gap: 6, zIndex: 5 }}>
        <button type="button" style={botao} onClick={alternarCheia}
          aria-label={cheia ? "Sair da tela cheia" : "Tela cheia"}
          title={cheia ? "Sair da tela cheia" : "Tela cheia"}>
          {cheia ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button type="button" style={botao} onClick={() => mapaRef.current?.zoomIn()} aria-label="Aproximar">
          <Plus size={15} />
        </button>
        <button type="button" style={botao} onClick={() => mapaRef.current?.zoomOut()} aria-label="Afastar">
          <Minus size={15} />
        </button>
        <button type="button" style={botao} onClick={enquadrar} aria-label="Enquadrar resultados" title="Enquadrar resultados">
          <Crosshair size={15} />
        </button>
      </div>

      {/* avisos de cobertura — número sem rótulo é número que engana */}
      <div style={{ position: "absolute", left: 10, bottom: 10, display: "grid", gap: 5, zIndex: 5 }}>
        {semCoordenadas > 0 && (
          <span className="fh-terr-chip-mapa">
            {semCoordenadas.toLocaleString("pt-BR")} sem coordenadas (fora do mapa, dentro da tabela)
          </span>
        )}
        {conexoesTruncadas && (
          <span className="fh-terr-chip-mapa">Mostrando as conexões mais fortes — aproxime para ver mais</span>
        )}
      </div>

      {tooltip && (
        <div
          className="fh-terr-tooltip"
          style={{
            left: Math.min(tooltip.x + 12, (caixaRef.current?.clientWidth ?? 600) - 230),
            top: Math.max(tooltip.y - 10, 8),
          }}
        >
          <div style={{ fontWeight: 800, color: C.bright, fontSize: 12 }}>{tooltip.titulo}</div>
          {tooltip.linhas.map((l) => (
            <div key={l} style={{ fontSize: 11, color: C.muted }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
