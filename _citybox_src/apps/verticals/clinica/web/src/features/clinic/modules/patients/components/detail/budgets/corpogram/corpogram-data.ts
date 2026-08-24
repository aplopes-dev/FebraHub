import { BODY_REGIONS, type BodyRegion } from "@/lib/body-regions";

/**
 * Mapa anatômico: silhueta via assets IMC (`/clinic/imc/{male,female}_{1..6}.svg`).
 * Regiões overlay calibradas no viewBox `0 0 200 480` (proporção da silhueta masculina
 * padrão `male_2`, com `preserveAspectRatio=meet`). Geometria orgânica (paths/elipses),
 * no mesmo espírito do odontograma/HOF — não retângulos.
 *
 * Lados (convenção anatômica):
 * - Vista **frontal**: direita do paciente = esquerda da tela (`*-direito` em x baixo).
 * - Vista **posterior**: direita do paciente = direita da tela (`*-direito` em x alto).
 */
export const CORPogram_VIEWBOX = "0 0 200 480";
/** Centro horizontal do overlay (viewBox). */
export const CORPogram_CENTER_X = 100;
/**
 * Escala X das regiões no sexo feminino — `female_2` (~119) é mais estreita que
 * `male_2` (~150); aproxima membros (ombro/mão/coxa/…) do eixo central.
 */
export const CORPogram_WOMAN_HORIZONTAL_SCALE = 0.8;

/** Transform SVG que comprime X em torno do centro (só mulher). */
export function corpogramGenderRegionsTransform(
  gender: CorpogramGender,
): string | undefined {
  if (gender !== "woman") {
    return undefined;
  }
  const c = CORPogram_CENTER_X;
  const s = CORPogram_WOMAN_HORIZONTAL_SCALE;
  return `translate(${c} 0) scale(${s} 1) translate(${-c} 0)`;
}

/** Deslocamento vertical (↑) das coxas no SVG feminino. */
export const CORPogram_WOMAN_THIGH_OFFSET_Y = -12;

const WOMAN_THIGH_REGION_IDS = new Set([
  "coxa-anterior-direita",
  "coxa-anterior-esquerda",
  "posterior-coxa-direita",
  "posterior-coxa-esquerda",
]);

/** Transform extra por região (ex.: coxa sobe um pouco na silhueta feminina). */
export function corpogramRegionGenderTransform(
  regionId: string,
  gender: CorpogramGender,
): string | undefined {
  if (gender !== "woman" || !WOMAN_THIGH_REGION_IDS.has(regionId)) {
    return undefined;
  }
  return `translate(0 ${CORPogram_WOMAN_THIGH_OFFSET_Y})`;
}

export type CorpogramView = "front" | "back";
export type CorpogramGender = "woman" | "man";

export type CorpogramEllipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Degrees; positive = clockwise (SVG). */
  rotate?: number;
};

export type CorpogramPath = {
  /** SVG path `d` (região fechada com curvas). */
  d: string;
};

export type CorpogramRegionShape = {
  id: string;
  label: string;
  view: CorpogramView;
  /** Polygon points (`x,y x,y …`) — legado / formas simples. */
  points?: string;
  /** Elipses (ATM, cotovelo, joelho…). */
  ellipses?: CorpogramEllipse[];
  /** Paths SVG orgânicos (tórax, membros, coluna…). */
  paths?: CorpogramPath[];
  /** Círculo legado. */
  cx?: number;
  cy?: number;
  r?: number;
};

const REGION_SHAPES: CorpogramRegionShape[] = [
  // ——— Frente ———
  {
    id: "pescoco-anterior",
    label: "Pescoço Anterior",
    view: "front",
    paths: [
      {
        d: "M 91,58 C 94,52 106,52 109,58 C 111,66 112,76 110,82 C 106,86 94,86 90,82 C 88,76 89,66 91,58 Z",
      },
    ],
  },
  {
    id: "atm-esquerda",
    label: "ATM Esquerda",
    view: "front",
    ellipses: [{ cx: 124, cy: 64, rx: 9, ry: 8, rotate: 18 }],
  },
  {
    id: "atm-direita",
    label: "ATM Direita",
    view: "front",
    ellipses: [{ cx: 76, cy: 64, rx: 9, ry: 8, rotate: -18 }],
  },
  {
    id: "ombro-esquerdo",
    label: "Ombro Esquerdo",
    view: "front",
    paths: [
      {
        // Vista frontal: direita do paciente = esquerda da tela (x baixo).
        // Este path (x alto) = lado esquerdo anatômico.
        d: "M 142,78 C 154,72 166,78 170,92 C 174,104 168,116 156,120 C 146,122 138,112 136,100 C 134,88 136,82 142,78 Z",
      },
    ],
  },
  {
    id: "ombro-direito",
    label: "Ombro Direito",
    view: "front",
    paths: [
      {
        d: "M 58,78 C 46,72 34,78 30,92 C 26,104 32,116 44,120 C 54,122 62,112 64,100 C 66,88 64,82 58,78 Z",
      },
    ],
  },
  {
    id: "cotovelo-esquerdo",
    label: "Cotovelo Esquerdo",
    view: "front",
    ellipses: [{ cx: 168, cy: 174, rx: 12, ry: 16, rotate: 8 }],
  },
  {
    id: "cotovelo-direito",
    label: "Cotovelo Direito",
    view: "front",
    ellipses: [{ cx: 32, cy: 174, rx: 12, ry: 16, rotate: -8 }],
  },
  {
    id: "punho-mao-esquerdo",
    label: "Punho / Mão Esquerdo",
    view: "front",
    paths: [
      {
        d: "M 160,218 C 170,212 182,218 184,232 C 186,248 182,266 174,276 C 166,280 156,272 154,256 C 152,240 154,224 160,218 Z",
      },
    ],
  },
  {
    id: "punho-mao-direito",
    label: "Punho / Mão Direito",
    view: "front",
    paths: [
      {
        d: "M 40,218 C 30,212 18,218 16,232 C 14,248 18,266 26,276 C 34,280 44,272 46,256 C 48,240 46,224 40,218 Z",
      },
    ],
  },
  {
    id: "torax",
    label: "Tórax",
    view: "front",
    paths: [
      {
        d: "M 78,90 C 90,86 110,86 122,90 C 132,98 136,118 134,142 C 132,154 120,160 100,160 C 80,160 68,154 66,142 C 64,118 68,98 78,90 Z",
      },
    ],
  },
  {
    id: "abdomen",
    label: "Abdômen",
    view: "front",
    paths: [
      {
        // Um pouco acima do valor original (168), sem colar no tórax.
        d: "M 70,164 C 84,160 116,160 130,164 C 136,172 136,186 130,196 C 120,202 80,202 70,196 C 64,186 64,172 70,164 Z",
      },
    ],
  },
  {
    id: "quadril-esquerdo",
    label: "Quadril Esquerdo",
    view: "front",
    paths: [
      {
        d: "M 106,204 C 120,200 142,206 144,218 C 146,230 138,236 124,238 C 112,238 106,230 106,218 Z",
      },
    ],
  },
  {
    id: "quadril-direito",
    label: "Quadril Direito",
    view: "front",
    paths: [
      {
        d: "M 94,204 C 80,200 58,206 56,218 C 54,230 62,236 76,238 C 88,238 94,230 94,218 Z",
      },
    ],
  },
  {
    id: "coxa-anterior-esquerda",
    label: "Coxa Anterior Esquerda",
    view: "front",
    paths: [
      {
        d: "M 108,250 C 124,246 148,252 148,270 C 148,290 144,310 138,322 C 130,330 114,328 108,318 C 104,292 104,266 108,250 Z",
      },
    ],
  },
  {
    id: "coxa-anterior-direita",
    label: "Coxa Anterior Direita",
    view: "front",
    paths: [
      {
        d: "M 92,250 C 76,246 52,252 52,270 C 52,290 56,310 62,322 C 70,330 86,328 92,318 C 96,292 96,266 92,250 Z",
      },
    ],
  },
  {
    id: "joelho-esquerdo",
    label: "Joelho Esquerdo",
    view: "front",
    ellipses: [{ cx: 122, cy: 346, rx: 15, ry: 14 }],
  },
  {
    id: "joelho-direito",
    label: "Joelho Direito",
    view: "front",
    ellipses: [{ cx: 78, cy: 346, rx: 15, ry: 14 }],
  },
  {
    id: "tornozelo-pe-esquerdo",
    label: "Tornozelo / Pé Esquerdo",
    view: "front",
    paths: [
      {
        d: "M 108,418 C 120,412 136,420 136,440 C 136,458 132,472 124,478 C 114,480 106,474 104,460 C 102,444 102,428 108,418 Z",
      },
    ],
  },
  {
    id: "tornozelo-pe-direito",
    label: "Tornozelo / Pé Direito",
    view: "front",
    paths: [
      {
        d: "M 92,418 C 80,412 64,420 64,440 C 64,458 68,472 76,478 C 86,480 94,474 96,460 C 98,444 98,428 92,418 Z",
      },
    ],
  },

  // ——— Costas ———
  // Vista posterior: direita anatômica = direita da tela (x alto) — sem espelho.
  {
    id: "coluna-cervical",
    label: "Coluna Cervical",
    view: "back",
    paths: [
      {
        d: "M 94,48 C 98,46 102,46 106,48 C 108,58 108,72 106,82 C 102,86 98,86 94,82 C 92,72 92,58 94,48 Z",
      },
    ],
  },
  {
    id: "coluna-toracica",
    label: "Coluna Torácica",
    view: "back",
    paths: [
      {
        d: "M 94,82 C 98,80 102,80 106,82 C 108,100 108,124 106,142 C 102,146 98,146 94,142 C 92,124 92,100 94,82 Z",
      },
    ],
  },
  {
    id: "coluna-lombar",
    label: "Coluna Lombar",
    view: "back",
    paths: [
      {
        d: "M 94,142 C 98,140 102,140 106,142 C 108,155 108,172 106,186 C 102,192 98,192 94,186 C 92,172 92,155 94,142 Z",
      },
    ],
  },
  {
    id: "escapula-direita",
    label: "Escápula Direita",
    view: "back",
    paths: [
      {
        d: "M 114,90 C 128,84 148,90 152,106 C 154,122 146,138 132,144 C 118,146 110,132 110,116 C 110,102 110,94 114,90 Z",
      },
    ],
  },
  {
    id: "escapula-esquerda",
    label: "Escápula Esquerda",
    view: "back",
    paths: [
      {
        d: "M 86,90 C 72,84 52,90 48,106 C 46,122 54,138 68,144 C 82,146 90,132 90,116 C 90,102 90,94 86,90 Z",
      },
    ],
  },
  {
    id: "gluteo-direito",
    label: "Glúteo Direito",
    view: "back",
    paths: [
      {
        d: "M 106,204 C 120,200 142,206 144,218 C 144,230 136,236 124,238 C 112,238 106,230 106,218 Z",
      },
    ],
  },
  {
    id: "gluteo-esquerdo",
    label: "Glúteo Esquerdo",
    view: "back",
    paths: [
      {
        d: "M 94,204 C 80,200 58,206 56,218 C 56,230 64,236 76,238 C 88,238 94,230 94,218 Z",
      },
    ],
  },
  {
    id: "posterior-coxa-direita",
    label: "Posterior Coxa Direita",
    view: "back",
    paths: [
      {
        d: "M 108,250 C 124,246 148,252 148,270 C 148,290 144,310 138,322 C 130,330 114,328 108,318 C 104,292 104,266 108,250 Z",
      },
    ],
  },
  {
    id: "posterior-coxa-esquerda",
    label: "Posterior Coxa Esquerda",
    view: "back",
    paths: [
      {
        d: "M 92,250 C 76,246 52,252 52,270 C 52,290 56,310 62,322 C 70,330 86,328 92,318 C 96,292 96,266 92,250 Z",
      },
    ],
  },
  {
    id: "panturrilha-direita",
    label: "Panturrilha Direita",
    view: "back",
    paths: [
      {
        d: "M 110,360 C 124,354 140,364 138,390 C 136,420 132,445 126,458 C 118,464 110,458 108,444 C 106,416 106,378 110,360 Z",
      },
    ],
  },
  {
    id: "panturrilha-esquerda",
    label: "Panturrilha Esquerda",
    view: "back",
    paths: [
      {
        d: "M 90,360 C 76,354 60,364 62,390 C 64,420 68,445 74,458 C 82,464 90,458 92,444 C 94,416 94,378 90,360 Z",
      },
    ],
  },
];

const shapeById = new Map(REGION_SHAPES.map((shape) => [shape.id, shape]));

export function corpogramRegionsForView(
  view: CorpogramView,
): CorpogramRegionShape[] {
  return REGION_SHAPES.filter((shape) => shape.view === view);
}

export function corpogramRegionShape(
  regionId: string,
): CorpogramRegionShape | undefined {
  return shapeById.get(regionId);
}

export function corpogramRegionIdsForView(view: CorpogramView): string[] {
  return corpogramRegionsForView(view).map((shape) => shape.id);
}

export function normalizeCorpogramRegionIds(ids: readonly string[]): string[] {
  const valid = new Set(BODY_REGIONS.map((region: BodyRegion) => region.id));
  return [...new Set(ids.filter((id) => valid.has(id)))];
}

export function defaultCorpogramGender(
  patientGender?: string | null,
): CorpogramGender {
  if (patientGender === "male" || patientGender === "man") {
    return "man";
  }
  return "woman";
}
