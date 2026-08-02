import type { StyleSpecification } from "maplibre-gl";

export type MapTheme = "light" | "dark";

/** Basemaps vetoriais CARTO (uso gratuito com atribuição) — um por tema. */
export const BASEMAP_STYLE_URLS: Record<MapTheme, string> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

export const MAP_ATTRIBUTION = "© CARTO · © OpenStreetMap contributors";

/**
 * Estilos locais mínimos usados como fallback quando o basemap remoto falha
 * (sem internet / CDN fora). As fronteiras estaduais e os pontos continuam
 * sendo desenhados pelas camadas deck.gl. A fonte vazia "credit" só existe
 * para manter a linha de atribuição (o estilo remoto traz a sua própria).
 */
function fallbackStyle(name: string, background: string): StyleSpecification {
  return {
    version: 8,
    name,
    sources: {
      credit: {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        attribution: MAP_ATTRIBUTION,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": background } },
      { id: "credit", type: "circle", source: "credit" },
    ],
  };
}

export const FALLBACK_STYLES: Record<MapTheme, StyleSpecification> = {
  dark: fallbackStyle("fallback-dark", "#050b18"),
  light: fallbackStyle("fallback-light", "#e9eef7"),
};

/** Enquadramento inicial do mapa (os quatro estados: BA · SE · AL · PE). */
export const FOCUS_BOUNDS: [[number, number], [number, number]] = [
  [-46.9, -18.5], // SW [lng, lat]
  [-34.5, -7.0], // NE [lng, lat]
];

type Rgba = [number, number, number, number];

/**
 * Paleta das camadas deck.gl por tema. Os estados fora do foco ficam apenas
 * levemente velados (o Brasil inteiro permanece visível); BA/SE/AL/PE ganham
 * contorno/tíngimento de destaque.
 */
export const MAP_LAYER_COLORS: Record<
  MapTheme,
  {
    dimFill: Rgba;
    dimLine: Rgba;
    focusFill: Rgba;
    focusLine: Rgba;
    /** Alfa das pontas dos arcos: piso + ganho proporcional à força. */
    arcSourceFloor: number;
    arcSourceGain: number;
    arcTargetFloor: number;
    arcTargetGain: number;
    arcFocusAlpha: number;
    leafStroke: Rgba;
    pointStroke: Rgba;
    pointStrokeHover: Rgba;
    pointStrokeSelected: Rgba;
    clusterFill: Rgba;
    clusterLine: Rgba;
    clusterText: Rgba;
  }
> = {
  dark: {
    dimFill: [10, 18, 34, 80],
    dimLine: [116, 148, 210, 60],
    focusFill: [59, 130, 246, 12],
    focusLine: [96, 165, 250, 150],
    arcSourceFloor: 112,
    arcSourceGain: 84,
    arcTargetFloor: 92,
    arcTargetGain: 70,
    arcFocusAlpha: 240,
    leafStroke: [235, 244, 255, 150],
    pointStroke: [235, 244, 255, 80],
    pointStrokeHover: [235, 244, 255, 220],
    pointStrokeSelected: [255, 255, 255, 255],
    clusterFill: [37, 82, 166, 190],
    clusterLine: [96, 165, 250, 230],
    clusterText: [232, 239, 252, 255],
  },
  light: {
    dimFill: [148, 163, 184, 30],
    dimLine: [71, 85, 105, 64],
    focusFill: [37, 99, 235, 16],
    focusLine: [37, 99, 235, 160],
    arcSourceFloor: 122,
    arcSourceGain: 84,
    arcTargetFloor: 102,
    arcTargetGain: 70,
    arcFocusAlpha: 235,
    leafStroke: [15, 23, 42, 140],
    pointStroke: [15, 23, 42, 90],
    pointStrokeHover: [15, 23, 42, 220],
    pointStrokeSelected: [15, 23, 42, 255],
    clusterFill: [37, 99, 235, 200],
    clusterLine: [30, 64, 175, 230],
    clusterText: [255, 255, 255, 255],
  },
};
