/**
 * Odontograma data — ported from clone/data.js (Simples Dental study clone).
 * SVG paths extracted from the original DOM for permanent crowns 11–18 / 41–48.
 */

export type ToothShape = {
  vb: string;
  paths: string[];
};

export type FaceLetter = 'M' | 'O' | 'D' | 'V' | 'P';

export type OdontogramTab = 'perm' | 'decid' | 'hof';

export type ArchQuadrantLayout = {
  topLeft: number[];
  topRight: number[];
  bottomLeft: number[];
  bottomRight: number[];
};

export type HofEllipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Degrees; positive = clockwise (SVG). */
  rotate?: number;
};

export type HofPolygon = {
  points: string;
  /** Degrees; positive = clockwise (SVG). Pivot defaults to polygon centroid if omitted. */
  rotate?: number;
  cx?: number;
  cy?: number;
};

export type HofPath = {
  /** SVG path `d` (ex.: curva Q para olheiras). */
  d: string;
};

export type HofRegion = {
  id: string;
  label: string;
  /** Single polygon points — mutually exclusive with `polygons` / `ellipses` / `paths`. */
  points?: string;
  /** Multiple polygons sharing the same region id (e.g. bilateral malar). */
  polygons?: HofPolygon[];
  /** One or more ellipses (e.g. bilateral têmpora). */
  ellipses?: HofEllipse[];
  /** Open/closed SVG paths (e.g. curved olheiras lines). */
  paths?: HofPath[];
};

/** Legacy HOF region ids/labels → current id (regiões unificadas). */
const HOF_REGION_ID_ALIASES: Record<string, string> = {
  'temporal-d': 'temporal',
  'temporal-e': 'temporal',
  'nasogeniano-d': 'nasogeniano',
  'nasogeniano-e': 'nasogeniano',
  'malar-d': 'malar',
  'malar-e': 'malar',
  'mandibula-d': 'mandibula',
  'mandibula-e': 'mandibula',
  cervical: 'submental',
};

const HOF_REGION_LABEL_ALIASES: Record<string, string> = {
  'Têmpora Direita': 'temporal',
  'Têmpora Esquerda': 'temporal',
  'Sulco Nasogeniano Direito': 'nasogeniano',
  'Sulco Nasogeniano Esquerdo': 'nasogeniano',
  'Região Malar Direita': 'malar',
  'Região Malar Esquerda': 'malar',
  'Mandíbula Direita': 'mandibula',
  'Mandíbula Esquerda': 'mandibula',
  'Região Perioral / Lábios': 'perioral',
  'Região Cervical': 'submental',
};

export function normalizeHofRegionId(regionId: string): string {
  return HOF_REGION_ID_ALIASES[regionId] ?? regionId;
}

export function normalizeHofRegionIds(regionIds: readonly string[]): string[] {
  return [...new Set(regionIds.map(normalizeHofRegionId))];
}

export function resolveHofRegionIdAlias(value: string): string | null {
  const byId = HOF_REGION_ID_ALIASES[value];
  if (byId) return byId;
  const byLabel = HOF_REGION_LABEL_ALIASES[value];
  if (byLabel) return byLabel;
  return null;
}


// Uma coroa por posição de dente (FDI 1..8) para arcada superior (11-18) e inferior (41-48).
// Todas as outras posições (quadrantes 21-28, 31-38 e toda a dentição decídua) são espelhos
// ou reaproveitamentos destas 16 formas — exatamente como o sistema original faz.
export const TOOTH_SHAPES: Record<number, ToothShape> = {
  11: { vb: '0 0 23 56', paths: [
    'M11.9942 0.817178C16.4798 0.743181 13.5942 15.1899 17.7982 28.8074C13.8613 26.6374 11.9941 27.7256 11.9941 27.7256C11.9941 27.7256 6.57379 27.2457 3.30908 32.2782C6.62971 21.4857 8.29117 1.51528 11.9941 0.817643L11.9942 0.817178Z',
    'M2.40441 53.3221C3.69951 55.803 10.6588 54.8753 12.5099 54.4497C18.5874 55.2892 21.8792 54.7561 21.6262 48.4215L21.736 41.3557C21.736 41.3557 22.1406 33.6665 18.2038 31.4967C14.2669 29.3267 12.3996 30.415 12.3996 30.415C12.3996 30.415 6.97939 29.935 3.71461 34.9675C0.449968 39.9999 0.679677 44.0679 0.866442 47.1678C1.05321 50.2678 1.10906 50.8411 2.40423 53.322L2.40441 53.3221Z'
  ]},
  12: { vb: '0 0 20 55', paths: [
    'M10.9267 1.18149C15.7018 0.206127 11.4953 17.4769 16.9503 31.5647C9.73614 28.6585 7.05558 29.7241 4.32864 31.8444C3.84467 25.4202 7.63403 4.22259 10.9268 1.18162L10.9267 1.18149Z',
    'M4.08972 52.6326C8.51981 52.9595 12.2454 53.3598 16.3914 53.5565C21.439 52.3262 18.4818 38.714 17.6921 34.9224C12.0846 30.3848 5.26914 32.9691 3.42269 35.658C2.05995 40.6304 -0.411521 51.4578 4.08946 52.6331L4.08972 52.6326Z'
  ]},
  13: { vb: '0 0 21 62', paths: [
    'M10.3319 1.62256C15.6124 1.20132 15.0854 26.2611 17.0221 36.6673C17.2321 37.7957 15.8765 34.6453 10.771 34.3429C10.771 34.3429 5.89982 34.3187 3.73364 37.1859C4.09697 26.1509 8.24469 3.17597 10.3318 1.62236L10.3319 1.62256Z',
    'M9.69877 61.1169C12.9205 60.3608 19.3974 55.1552 19.8036 52.9235C20.5939 50.9265 19.1229 43.2328 17.5894 40.8994C15.0804 36.9059 10.3573 36.9684 10.3573 36.9684C10.3573 36.9684 6.14533 37.0583 3.97901 39.9254C1.81277 42.7925 0.504684 50.0514 1.35046 52.3537C2.27673 55.7244 4.87157 59.3698 9.69824 61.1168L9.69877 61.1169Z'
  ]},
  14: { vb: '0 0 21 52', paths: [
    'M10.6704 0.811045C14.5287 0.974628 14.5451 19.6373 16.4819 27.7644C16.7479 28.8801 15.9954 26.6541 10.8898 26.3517C10.8898 26.3517 6.01879 26.3276 3.85254 29.1947C4.5454 23.174 7.70457 3.96054 10.6706 0.810913L10.6704 0.811045Z',
    'M10.9177 51.1826C13.8099 50.9964 18.7494 47.6142 19.1555 45.3824C19.9459 43.3854 19.2437 35.2358 17.7102 32.9024C15.2013 28.909 10.4781 28.9715 10.4781 28.9715C10.4781 28.9715 6.26606 29.0614 4.09981 31.9285C1.93357 34.7956 0.735332 43.8784 1.58111 46.1806C2.50731 49.5514 6.96953 50.6892 10.9174 51.1831L10.9177 51.1826Z'
  ]},
  15: { vb: '0 0 21 54', paths: [
    'M6.19967 2.55361C8.30861 5.44121 14.5103 24.1041 17.7329 32.3108C17.0128 31.1333 14.1265 29.7278 10.3736 29.9175C10.3736 29.9175 5.50249 29.7794 4.1051 32.1907C5.1984 25.0951 3.58635 -1.89675 6.1998 2.55341L6.19967 2.55361Z',
    'M13.5465 2.55966C12.4261 4.5355 11.6066 6.78721 11.3499 8.61193C11.9643 11.0319 13.4737 14.6804 15.4215 19.8887C15.9758 15.4146 15.9403 0.958478 13.5465 2.55979V2.55966Z',
    'M10.5135 53.2426C12.8565 53.2843 18.6029 47.9885 19.0813 46.7586C19.5589 45.5287 19.3699 43.1222 19.2966 41.3558C19.2234 39.5893 18.593 35.9697 17.873 34.7921C17.153 33.6146 14.2666 32.2091 10.5137 32.3988C10.5137 32.3988 5.64266 32.2607 4.24527 34.672C2.84788 37.0832 0.880781 45.4823 1.50686 47.7839C2.96276 50.1878 7.28584 52.2328 10.5138 53.2423L10.5135 53.2426Z'
  ]},
  16: { vb: '0 0 24 51', paths: [
    'M5.74685 4.42955C9.34858 6.79654 6.97146 21.7101 12.0078 23.5638C18.0854 24.4033 12.8097 3.81208 17.3898 2.8342C21.687 7.07447 22.3142 30.9854 20.8873 29.1025C18.7079 27.1604 15.6176 25.3316 13.216 25.3996C10.8143 25.4674 5.37901 27.3129 3.76246 27.7867C1.73501 24.2515 3.4318 4.79255 5.74718 4.42948L5.74685 4.42955Z',
    'M12.2768 20.7474C13.255 20.1871 13.6031 16.298 13.3454 12.0114C13.1012 7.94922 12.3243 3.52979 10.629 1.24741C9.19334 0.359825 9.46371 5.33861 9.82273 10.422C10.1719 15.3653 10.7887 20.0531 12.2768 20.7474Z',
    'M1.72828 48.5462C3.35291 51.597 13.4973 49.3017 15.3484 48.876C21.426 49.7155 22.4109 49.0685 22.4877 46.7227C22.8307 41.8457 23.0185 34.4157 21.5917 32.5328C19.4122 30.5907 16.7613 28.306 14.0303 28.032C11.2991 27.758 5.97405 29.4895 4.35683 29.9633C2.73975 30.4371 0.662808 35.303 0.849573 38.4031C1.03627 41.5031 0.103641 45.4954 1.72828 48.5464V48.5462Z'
  ]},
  17: { vb: '0 0 24 51', paths: [
    'M6.64509 5.91923C10.796 10.5656 6.11229 18.7549 12.0274 24.5977C18.4344 24.4115 14.1473 3.36455 17.7388 4.32388C21.0475 4.3474 23.2125 31.3349 20.6871 29.9085C18.6176 27.9664 16.0764 27.5053 13.345 27.2312C10.6139 26.9572 6.82649 27.549 4.55006 28.9346C2.66711 28.0772 4.04284 8.41164 6.64463 5.91923H6.64509Z',
    'M12.7539 22.1451C13.7321 21.5848 14.5195 16.556 14.2619 12.2689C14.0177 8.20672 13.0212 4.01521 11.3258 1.73282C8.7919 -0.0665226 9.94091 6.73579 10.2999 11.8191C10.649 16.7623 10.3872 20.5385 12.7539 22.1445V22.1451Z',
    'M2.27131 47.7058C3.89594 50.7566 12.1734 49.7149 14.0244 49.2892C20.102 50.1287 22.1854 48.3421 22.2622 45.9963C22.6052 41.1193 23.0127 34.0311 20.4873 32.6041C18.4178 30.662 15.9865 29.8589 13.2553 29.5849C10.5241 29.3109 9.04327 29.7887 7.42619 30.2626C5.80917 30.7364 2.96331 33.095 2.38122 35.967C1.79906 38.8391 0.646735 44.6547 2.27137 47.7056L2.27131 47.7058Z'
  ]},
  18: { vb: '0 0 23 47', paths: [
    'M5.31293 4.03889C7.15726 4.01259 7.52616 19.952 11.7937 22.0337C17.6516 18.8843 13.8038 7.0686 16.4068 2.32958C20.4843 -0.496074 21.3312 28.6569 20.4536 27.1165C18.2741 25.1744 15.0739 24.1435 12.343 23.8694C9.61178 23.5953 7.14236 24.9849 4.75641 25.4588C3.3314 20.7635 2.72466 9.89214 5.3132 4.03942L5.31293 4.03889Z',
    'M11.8219 19.303C12.8002 18.7427 13.9171 13.9419 13.6594 9.65472C13.4152 5.59253 12.0892 3.9084 10.3939 1.62561C7.85979 -0.173733 8.25777 3.73621 9.1482 8.74905C10.0465 13.8063 10.3338 16.5569 11.8219 19.3024V19.303Z',
    'M2.73169 43.8554C4.24648 45.6526 11.8646 45.4087 13.7156 44.9831C16.7177 46.1645 21.1081 44.7197 21.1849 42.3739C21.5278 37.4969 21.2763 31.4344 20.3986 29.894C18.2192 27.9519 15.0191 26.9209 12.288 26.6469C9.55686 26.3729 7.08744 27.7625 4.7015 28.2363C2.31556 28.7101 1.00747 32.5503 1.19424 35.6499C1.381 38.7499 1.21743 42.0584 2.73195 43.8553L2.73169 43.8554Z'
  ]},
  41: { vb: '0 0 17 52', paths: [
    'M7.87858 50.2746C5.02192 49.986 1.06056 17.593 1.66505 19.1685C2.26934 20.7436 5.95481 23.0727 7.7089 23.0528C9.46306 23.0329 12.5827 21.3908 13.9367 18.1071C13.2991 23.0699 11.6364 49.8889 7.87858 50.2745V50.2746Z',
    'M14.5143 1.94358C13.3825 0.537838 2.3034 0.136954 1.31095 1.6212C0.318355 3.10538 0.862085 13.746 1.4663 15.3208C2.07059 16.896 5.91136 20.3533 7.66546 20.3334C9.41962 20.3135 13.1606 16.8318 14.5146 13.5479C15.8686 10.264 15.6465 3.34899 14.5146 1.94378L14.5143 1.94358Z'
  ]},
  42: { vb: '0 0 16 51', paths: [
    'M8.46387 50.0769C6.7062 49.8051 5.45694 44.2248 3.9927 37.7017C2.41749 30.6842 0.715543 22.575 1.47367 18.8099C2.07795 20.385 4.52074 22.2305 7.51752 22.2107C10.5144 22.1908 14.1871 19.5859 14.5217 17.6817C14.8565 15.7775 12.8976 29.7581 11.4803 36.4794C9.97985 43.5949 10.3749 50.6004 8.46361 50.0776L8.46387 50.0769Z',
    'M13.5659 2.08323C12.434 0.677493 2.2871 0.115544 1.29464 1.59973C0.301988 3.08391 0.845704 13.7245 1.44992 15.2994C2.05421 16.8744 4.49699 19.687 7.49378 19.6672C10.4906 19.6473 13.9209 16.8103 14.498 13.5264C15.0752 10.2426 14.6978 3.48857 13.5659 2.08336L13.5659 2.08323Z'
  ]},
  43: { vb: '0 0 20 60', paths: [
    'M11.554 58.7489C14.5048 58.7681 12.5595 51.3479 14.2495 44.4351C16.5533 35.0114 18.0081 26.7617 17.6415 23.5975C15.8117 26.0698 11.8055 27.3486 10.2365 27.0084C6.81672 26.7199 3.26282 23.0249 2.47441 21.5471C1.22033 22.7046 3.39599 31.8129 5.48128 40.9272C7.52748 49.8706 7.66567 58.8358 11.5545 58.7491L11.554 58.7489Z',
    'M1.03665 7.13838C1.71044 5.46326 10.0675 1.23346 11.9186 1.65906C13.6468 2.10898 17.5599 5.86548 18.8605 8.49298C19.5936 16.2836 18.4613 24.2517 10.3676 24.5558C6.94788 24.2674 2.46174 18.9608 1.67334 17.4827C0.772703 14.544 0.362611 8.81298 1.03633 7.13812L1.03665 7.13838Z'
  ]},
  44: { vb: '0 0 20 54', paths: [
    'M11.072 52.4429C13.6067 52.4688 13.202 44.278 14.587 37.0751C16.0866 29.2772 18.4929 22.7096 17.5478 21.7238C16.0457 23.1005 14.9887 24.0831 13.094 23.9258C9.67423 23.6373 4.33351 23.4076 3.00184 21.6074C1.99885 24.0833 4.87273 35.7655 6.80531 43.1672C8.68508 50.3668 8.74451 52.5167 11.0723 52.4425L11.072 52.4429Z',
    'M1.92397 5.59619C2.59776 3.92107 8.39197 0.416522 10.2433 0.842192C11.6008 1.1119 18.3525 3.39688 18.9104 5.06233C19.8439 7.8487 18.5405 16.5027 18.1169 17.6688C17.4691 19.5291 14.5481 21.7205 12.6534 21.5632C9.23364 21.2747 3.58213 20.8838 2.6387 18.2777C1.73807 15.339 1.25031 7.27125 1.92403 5.59573L1.92397 5.59619Z'
  ]},
  45: { vb: '0 0 20 53', paths: [
    'M10.3598 52.1767C13.3004 52.2403 11.9568 46.7298 13.4643 38.0014C14.8203 30.1499 17.1457 21.1893 16.648 21.4185C15.6153 23.0366 12.329 23.7515 7.64428 23.8462C5.85554 23.5577 3.23335 21.8775 2.44495 20.3995C4.30617 26.1341 6.50276 52.6167 10.3601 52.1767H10.3598Z',
    'M1.5576 5.19133C2.69734 3.51621 8.72476 0.414612 10.5758 0.840217C12.304 1.29014 17.3819 3.75724 18.3718 5.17603C18.8663 6.91753 18.6645 16.056 17.6405 17.6831C16.0641 20.1876 12.4672 21.3861 7.78213 21.4808C5.99339 21.1922 2.51694 18.2227 1.72847 16.7447C0.905549 14.6925 0.417737 6.86651 1.55754 5.19166L1.5576 5.19133Z'
  ]},
  46: { vb: '0 0 24 52', paths: [
    'M11.5001 30.5259C16.5857 30.3928 11.9413 49.2342 15.5073 49.0096C18.1228 48.8448 19.9529 21.6879 19.5292 22.8539C18.0271 24.6336 14.6401 24.0852 12.7457 23.9279C9.32593 23.2364 4.83979 24.6183 3.35243 22.0123C2.29643 20.927 3.59504 50.2517 6.75421 50.7519C11.3599 51.4585 6.09858 30.4628 11.5005 30.5251L11.5001 30.5259Z',
    'M2.75202 2.65382C5.52288 -0.0688851 9.22001 1.01997 11.0713 1.44557C12.4289 1.71535 20.925 0.184661 22.3792 3.57055C23.2083 5.501 22.4754 14.5273 22.0517 15.6934C20.6273 20.2935 17.3179 21.9209 14.8793 21.6024C11.4595 20.911 4.09938 22.4542 2.61202 18.5587C2.02205 15.7812 -0.0191174 5.37652 2.75168 2.65355L2.75202 2.65382Z'
  ]},
  47: { vb: '0 0 24 52', paths: [
    'M3.82767 37.8464C4.23519 42.5655 5.31027 51.5824 7.37303 50.8384C11.3083 49.42 5.8053 30.3499 11.603 30.9164C15.8343 31.9114 12.0472 46.7421 15.921 48.5945C18.5153 49.835 19.4554 32.8 19.9229 29.4907C20.2993 26.8269 20.1406 19.9609 19.3215 21.3913C18.8503 22.0685 17.1884 22.7667 16.2658 22.5459C12.4047 22.1205 10.5097 22.9868 7.34361 22.1565C5.19287 21.5923 4.91097 21.7763 3.99854 20.308C2.24359 17.4498 3.42009 33.1272 3.82761 37.8463L3.82767 37.8464Z',
    'M2.0559 2.62743C4.17213 0.4162 6.20038 1.82195 8.31965 1.2755C11.6336 0.421044 14.5188 1.09495 15.5789 1.33843C16.9365 1.60814 20.6055 0.160202 22.1492 2.73801C23.6569 5.25552 22.0357 7.5831 21.6465 10.8718C21.3057 13.7508 21.7865 15.2834 20.9674 16.7142C20.1643 18.2522 18.3306 20.1213 16.3582 19.9641C12.4972 19.5386 10.6022 20.4049 7.43605 19.5745C5.2853 19.0105 3.68306 17.0187 2.77064 15.5503C2.33602 11.0804 -0.0601921 4.83801 2.05597 2.62717L2.0559 2.62743Z'
  ]},
  48: { vb: '0 0 23 51', paths: [
    'M7.53584 49.2495C10.8497 48.395 6.35642 29.3255 11.6105 29.0048C16.2301 29.3551 12.558 44.9312 15.6954 46.5219C16.6568 46.9955 17.5933 40.641 18.4935 33.8903C19.4557 26.6741 19.7443 21.8496 19.096 20.9307C17.1278 22.2268 16.6146 22.0006 14.6422 21.8433C10.7811 21.418 7.87651 22.2038 4.71032 21.3733C2.74912 20.7756 3.0939 26.9788 3.89741 33.7407C4.72841 40.7342 4.60154 48.0776 7.53578 49.2496L7.53584 49.2495Z',
    'M2.68525 3.2977C4.80141 1.08647 5.74232 2.25039 7.8616 1.70401C11.1755 0.849491 14.7598 1.5234 15.8198 1.76694C17.1774 2.03665 19.7318 1.27363 21.0698 3.97241C21.8784 5.60341 21.9659 8.57568 21.5767 11.8644C21.2359 14.7434 20.0857 16.276 19.2666 17.7068C18.4634 19.2448 16.6298 19.8245 14.6574 19.6672C10.7964 19.2419 7.89174 20.0275 4.72555 19.1972C2.73673 19.219 2.19651 15.9328 1.91726 12.1241C1.6386 8.32485 0.685097 5.53597 2.68525 3.29665V3.2977Z'
  ]}
};

// Mapa de faces (M / O-I / D / V / L-P) — é o MESMO desenho de "cruz" para qualquer dente,
// confirmado comparando o SVG de faces do dente 11, do 16 e do 48 no sistema real: são
// idênticos, byte a byte.
export const FACE_SHAPE: { vb: string; paths: Record<FaceLetter, string> } = {
  vb: '0 0 27 27',
  paths: {
    V: 'M18.2439 18.2354L24.0947 24.0999C20.7001 27.4945 13.9521 24.7899 13.4002 24.7899C12.8228 24.7899 6.08666 27.4945 2.70581 24.0999C4.85848 21.9473 6.16935 20.6433 8.57728 18.2354H18.2368H18.2439Z',
    D: 'M8.58244 18.2344C6.27799 20.5112 5.03609 21.7531 2.71097 24.0989C-0.683593 20.7182 2.02103 13.9564 2.02103 13.4045C2.02103 12.7836 -0.683593 6.09093 2.71097 2.71008L8.57557 8.58155V18.2411L8.58244 18.2344Z',
    P: 'M8.5815 8.57556C6.27705 6.278 5.05583 5.0361 2.73071 2.71098C6.12528 -0.683584 12.8733 2.02103 13.4251 2.02103C14.0026 2.02101 20.7387 -0.683584 24.1196 2.71098C21.9669 4.86365 20.656 6.16762 18.2481 8.57556H8.58854H8.5815Z',
    M: 'M18.2446 8.57504C20.5491 6.27059 21.7841 5.05632 24.1092 2.72424C27.5038 6.11881 24.7991 12.8668 24.7991 13.4187C24.7992 13.9962 27.5038 20.7323 24.1092 24.1131L18.2446 18.2416V8.58207V8.57504Z',
    O: 'M8.58374 8.57568V18.2353H18.2433V8.57568H8.58374Z'
  }
};
// Ordem visual das siglas mostradas na UI (o sistema chama Palatina/Lingual sempre de "P" no d,
// e a legenda combina os dois nomes possíveis: "L/P").
export const FACE_ORDER: FaceLetter[] = ['M', 'O', 'D', 'V', 'P'];
export const FACE_UI_LABEL: Record<FaceLetter, string> = { M: 'M', O: 'O/I', D: 'D', V: 'V', P: 'L/P' };

// Dentes decíduos reaproveitam exatamente as mesmas formas dos permanentes equivalentes
// (confirmado: o d do dente 51 é idêntico ao do dente 11, e assim por diante).
export const DECID_TO_PERM: Record<number, number> = { 51: 11, 52: 12, 53: 13, 54: 16, 55: 17, 81: 41, 82: 42, 83: 43, 84: 46, 85: 47 };

// Ordem visual de cada quadrante, como aparece na tela (esquerda -> direita).
export const ARCH_LAYOUT: Record<"perm" | "decid", ArchQuadrantLayout> = {
  perm: {
    topLeft: [18, 17, 16, 15, 14, 13, 12, 11],
    topRight: [21, 22, 23, 24, 25, 26, 27, 28],
    bottomLeft: [48, 47, 46, 45, 44, 43, 42, 41],
    bottomRight: [31, 32, 33, 34, 35, 36, 37, 38]
  },
  decid: {
    topLeft: [55, 54, 53, 52, 51],
    topRight: [61, 62, 63, 64, 65],
    bottomLeft: [85, 84, 83, 82, 81],
    bottomRight: [71, 72, 73, 74, 75]
  }
};

// Resolve, para qualquer número FDI (permanente ou decíduo), qual forma-base usar e se
// precisa espelhar horizontalmente (lado esquerdo do arco é sempre o espelho do lado direito).
export function resolveToothShape(n: number): { key: number; mirror: boolean } | null {
  if (n >= 11 && n <= 18) return { key: n, mirror: false };
  if (n >= 21 && n <= 28) return { key: n - 10, mirror: true };
  if (n >= 41 && n <= 48) return { key: n, mirror: false };
  if (n >= 31 && n <= 38) return { key: n + 10, mirror: true };
  if (n >= 51 && n <= 55) {
    const key = DECID_TO_PERM[n];
    return key == null ? null : { key, mirror: false };
  }
  if (n >= 61 && n <= 65) {
    const key = DECID_TO_PERM[n - 10];
    return key == null ? null : { key, mirror: true };
  }
  if (n >= 81 && n <= 85) {
    const key = DECID_TO_PERM[n];
    return key == null ? null : { key, mirror: false };
  }
  if (n >= 71 && n <= 75) {
    const key = DECID_TO_PERM[n + 10];
    return key == null ? null : { key, mirror: true };
  }
  return null;
}

export function isUpperArch(n: number): boolean {
  return (n >= 11 && n <= 28) || (n >= 51 && n <= 65);
}

// Regiões clicáveis do mapa facial de HOF, sobrepostas às fotos reais do sistema
// (assets/hof-face-mulher.png e assets/hof-face-homem.png, ambas 364x344px — baixadas
// do próprio app.simplesdental.com a pedido do usuário). Coordenadas no viewBox 0 0 364 344,
// estimadas visualmente sobre a foto (direita/esquerda seguem o lado do PACIENTE, por isso
// aparecem invertidos em relação a quem olha a tela).
export const HOF_REGIONS: HofRegion[] = [
  // Trapézio isósceles (topo estreito, base larga perto das sobrancelhas).
  { id: 'frontal', label: 'Região Frontal', points: '145,75 209,75 231,110 123,110' },
  // Funil 5∶3 (topo largo → base estreita).
  { id: 'glabela', label: 'Glabela', points: '166,118 190,118 185,142 171,142' },
  // Nariz, logo abaixo da glabela, centro ≈178.
  { id: 'nariz', label: 'Nariz', points: '174,148 182,148 186,181 170,181' },
  // Têmpora bilateral: um único id; clicar em qualquer lado seleciona ambos.
  // Inclinação: topo para dentro, base para fora.
  {
    id: 'temporal',
    label: 'Têmpora',
    ellipses: [
      { cx: 108, cy: 114, rx: 6, ry: 14, rotate: 14 },
      { cx: 244, cy: 114, rx: 6, ry: 14, rotate: -14 },
    ],
  },
  {
    id: 'malar',
    label: 'Região Malar',
    // Esquerda da tela: horário; direita: anti-horário (mesma magnitude).
    // Espelhados em x=178 (eixo do nariz) para distância igual.
    polygons: [
      // Verticais de fora levemente mais altas; topo com leve quebra para dentro.
      { points: '105,171 129,174 152,173 154,185 110,187', rotate: 15, cx: 130, cy: 179 },
      { points: '204,173 228,174 251,171 246,187 202,185', rotate: -15, cx: 226, cy: 179 },
    ],
  },
  {
    id: 'bochecha',
    label: 'Bochecha',
    // Elipses bilaterais abaixo do malar (mais largas que altas); seleção unificada.
    ellipses: [
      { cx: 128, cy: 196, rx: 11, ry: 6, rotate: 8 },
      { cx: 228, cy: 196, rx: 11, ry: 6, rotate: -8 },
    ],
  },
  {
    id: 'olheiras',
    label: 'Olheiras',
    // Curvas bilaterais acima do malar (desenhadas após o malar p/ receber clique).
    paths: [
      { d: 'M 126,158 Q 141,174 159,157' },
      { d: 'M 197,157 Q 215,174 230,158' },
    ],
  },
  {
    id: 'canto-olhos',
    label: 'Canto dos Olhos',
    // Trapézio irregular bilateral: topo curto, base longa; interno quase vertical, externo inclinado para fora.
    polygons: [
      { points: '105,134 114,136 116,154 100,159', rotate: -20, cx: 109, cy: 146 },
      { points: '240,136 249,134 254,159 239,154', rotate: 20, cx: 245, cy: 146 },
    ],
  },
  {
    id: 'perioral',
    label: 'Lábios',
    // Contorno de lábio: arco do cupido no topo, cantos pontudos, base mais curva.
    points:
      '148,216 160,206 168,204 178,207 188,204 196,206 208,216 198,225 178,231 158,225',
  },
  {
    id: 'nasogeniano',
    label: 'Sulco Nasogeniano',
    // Curvas bilaterais na direção nariz→canto dos lábios (sem colar nas pontas).
    // Linhas inteiras giradas: esq. anti-horário / dir. horário (pivô na ponta do nariz).
    paths: [
      { d: 'M 162,192 C 146,197 139,213 141,219' },
      { d: 'M 194,192 C 210,197 217,213 215,219' },
    ],
  },
  {
    id: 'mento',
    label: 'Mento',
    // Elipse central no estilo da bochecha, um pouco maior.
    ellipses: [{ cx: 178, cy: 251, rx: 19, ry: 8 }],
  },
  {
    id: 'pre-jowl',
    label: 'Pré Jowl',
    // Linhas verticais bilaterais abaixo das pontas dos lábios (perpendiculares à base).
    paths: [
      { d: 'M 148,224 L 148,238' },
      { d: 'M 208,224 L 208,238' },
    ],
  },
  {
    id: 'mandibula',
    label: 'Mandíbula',
    // Ângulo ~160° no vértice: as duas linhas (topo e base) compartilham o ajuste.
    paths: [
      { d: 'M 111,201 L 126,229 L 147,248' },
      { d: 'M 245,201 L 230,229 L 209,248' },
    ],
  },
  {
    id: 'submental',
    label: 'Submental (papada)',
    // Curva abaixo do mento, concavidade para cima (formato U).
    paths: [{ d: 'M 142,265 Q 178,285 214,265' }],
  },
  {
    id: 'pescoco',
    label: 'Pescoço',
    // 3 traços verticais abaixo da papada; cantos com leve inclinação para fora.
    // Diagonais encurtadas em y para ter o mesmo comprimento (48) do traço central.
    paths: [
      { d: 'M 140,292 L 122,336.5' },
      { d: 'M 178,292 L 178,340' },
      { d: 'M 216,292 L 234,336.5' },
    ],
  },
];
