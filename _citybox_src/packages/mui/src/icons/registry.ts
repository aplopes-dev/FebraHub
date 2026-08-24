/**
 * Mapa semântico → glifo Solar (sem sufixo de estilo).
 *
 * Apps usam só o `name` (ex.: "home"). O estilo vem da prop/context `variant`.
 * Trocar a lib = editar este arquivo.
 *
 * Catálogo Solar: https://icon-sets.iconify.design/solar/
 * Estilos: linear | line-duotone | bold | bold-duotone
 */

export const ICON_VARIANTS = [
  "linear",
  "line-duotone",
  "bold",
  "bold-duotone",
] as const;

export type IconVariant = (typeof ICON_VARIANTS)[number];

/** Estilo padrão quando o app não define variant na prop nem no provider. */
export const DEFAULT_ICON_VARIANT: IconVariant = "linear";

/**
 * Glifo Solar sem prefixo `solar:` e sem sufixo de estilo.
 * Ex.: `home-2` → `solar:home-2-bold` / `solar:home-2-linear` …
 */
export const ICON_MAP = {
  // Ações comuns
  home: "home-2",
  settings: "settings",
  search: "magnifer",
  delete: "trash-bin-trash",
  edit: "pen",
  close: "close-circle",
  check: "check-circle",
  plus: "add-circle",
  minus: "minus-circle",
  eye: "eye",
  "eye-off": "eye-closed",
  menu: "hamburger-menu",
  "chevron-left": "alt-arrow-left",
  "chevron-right": "alt-arrow-right",
  "chevron-down": "alt-arrow-down",
  "chevron-up": "alt-arrow-up",
  "arrow-left": "arrow-left",
  "arrow-right": "arrow-right",
  "arrow-down-left": "arrow-left-down",
  "arrow-up-right": "arrow-right-up",
  "panel-close": "sidebar-minimalistic",
  filter: "filter",
  upload: "upload",
  download: "download",
  "more-horizontal": "menu-dots",
  copy: "copy",
  restore: "restart",
  history: "history-2",
  sort: "sort",
  info: "info-circle",
  warning: "danger-triangle",
  help: "question-circle",
  logout: "logout-2",
  notification: "bell",
  sun: "sun-2",
  moon: "moon",
  "map-pin": "map-point",
  "chevrons-up-down": "sort-vertical",

  // Navegação / domínio
  dashboard: "widget-2",
  sales: "cart-large-2",
  cart: "cart-large-2",
  products: "box",
  package: "box",
  boxes: "box-minimalistic",
  warehouse: "home-smile",
  stock: "widget-5",
  customers: "users-group-rounded",
  users: "users-group-rounded",
  user: "user",
  phone: "phone",
  calendar: "calendar",
  finance: "wallet",
  wallet: "wallet",
  reports: "graph-up",
  chart: "chart",
  pos: "monitor",
  devices: "tablet",
  tablet: "tablet",
  plan: "card",
  "credit-card": "card",
  mail: "letter",
  document: "document-text",
  clipboard: "clipboard-list",
  tag: "tag",
  tags: "tag-horizontal",
  star: "star",
  sliders: "tuning-2",
  folder: "folder-with-files",
  ruler: "ruler-angular",
  receipt: "bill-list",
  truck: "delivery",
  megaphone: "volume-loud",
  transfer: "transfer-horizontal",
  scale: "list-check",
  checklist: "checklist",
  ticket: "ticket",
  landmark: "banknote-2",
  building: "buildings",
  list: "list",
  target: "target",
  calculator: "calculator",
  clock: "clock-circle",
  "file-input": "file-send",
  statement: "document-text",
  dollar: "dollar",
  grid: "widget-5",
  grip: "sort-vertical",
  zap: "bolt",
  factory: "industry",
  "menu-dots": "menu-dots",
} as const;

export type IconName = keyof typeof ICON_MAP;

/** ID Iconify bruto (ex.: `solar:home-2-bold`). Só para uso interno / debug. */
export type IconifyId = `solar:${(typeof ICON_MAP)[IconName]}-${IconVariant}`;

export function resolveIconId(
  name: IconName,
  variant: IconVariant = DEFAULT_ICON_VARIANT,
): IconifyId {
  return `solar:${ICON_MAP[name]}-${variant}`;
}
