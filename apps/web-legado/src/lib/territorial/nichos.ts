import {
  Boxes,
  Car,
  Cpu,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Store,
  User,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/**
 * Fonte única de configuração de nichos (cores, ícones, símbolos).
 * Nenhum componente deve declarar cor de nicho fora daqui.
 */
export type NicheId =
  | "tecnologia"
  | "saude"
  | "varejo"
  | "automotivo"
  | "construcao"
  | "financeiro"
  | "educacao"
  | "industria"
  | "agronegocio"
  | "outros"
  | "mei"
  | "pessoa-fisica";

export interface NicheDef {
  id: NicheId;
  name: string;
  /** Cor hex — usada em mapa, legenda, chips e tabela. */
  color: string;
  icon: LucideIcon;
  /** Marcador textual curto para não depender apenas de cor (acessibilidade). */
  symbol: string;
}

export const NICHES: NicheDef[] = [
  { id: "tecnologia", name: "Tecnologia", color: "#3b82f6", icon: Cpu, symbol: "TE" },
  { id: "saude", name: "Saúde", color: "#34d399", icon: HeartPulse, symbol: "SA" },
  { id: "varejo", name: "Varejo", color: "#fb923c", icon: ShoppingBag, symbol: "VA" },
  { id: "automotivo", name: "Automotivo", color: "#f87171", icon: Car, symbol: "AU" },
  { id: "construcao", name: "Construção", color: "#facc15", icon: HardHat, symbol: "CO" },
  { id: "financeiro", name: "Serviços financeiros", color: "#a78bfa", icon: Landmark, symbol: "FI" },
  { id: "educacao", name: "Educação", color: "#22d3ee", icon: GraduationCap, symbol: "ED" },
  { id: "industria", name: "Indústria", color: "#f472b6", icon: Factory, symbol: "IN" },
  { id: "agronegocio", name: "Agronegócio", color: "#a3e635", icon: Wheat, symbol: "AG" },
  { id: "outros", name: "Outros", color: "#94a3b8", icon: Boxes, symbol: "OU" },
  { id: "mei", name: "MEI", color: "#2dd4bf", icon: Store, symbol: "ME" },
  { id: "pessoa-fisica", name: "Pessoa Física", color: "#818cf8", icon: User, symbol: "PF" },
];

export const NICHE_MAP: Record<NicheId, NicheDef> = Object.fromEntries(
  NICHES.map((n) => [n.id, n]),
) as Record<NicheId, NicheDef>;

export const NICHE_IDS = NICHES.map((n) => n.id);

export function isNicheId(value: string): value is NicheId {
  return (NICHE_IDS as string[]).includes(value);
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Cor do nicho no formato RGBA usado pelo deck.gl. */
export function nicheColorRgb(id: NicheId, alpha = 255): [number, number, number, number] {
  const [r, g, b] = hexToRgb(NICHE_MAP[id].color);
  return [r, g, b, alpha];
}
