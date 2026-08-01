import {
  CalendarDays, GraduationCap, Megaphone, Package, ShoppingBag, TrendingUp, Wallet,
  type LucideIcon,
} from "lucide-react";

export interface DefinicaoHub {
  key: string;
  nome: string;
  Icone: LucideIcon;
  desc: string;
}

export const HUBS: readonly DefinicaoHub[] = [
  { key: "comercial",  nome: "Comercial",  Icone: TrendingUp,    desc: "Pódio de consultoras e placar da semana" },
  { key: "financeiro", nome: "Financeiro", Icone: Wallet,        desc: "Receita por curso e cobertura" },
  { key: "marketing",  nome: "Marketing",  Icone: Megaphone,     desc: "Origem de leads e campanhas" },
  { key: "pedagogico", nome: "Pedagógico", Icone: GraduationCap, desc: "Turmas, matrículas e conclusão" },
  { key: "eventos",    nome: "Eventos",    Icone: CalendarDays,  desc: "Ingressos e receita líquida" },
  { key: "loja",       nome: "Loja",       Icone: ShoppingBag,   desc: "Vendas, formas de pagamento e recebimento" },
  { key: "estoque",    nome: "Estoque",    Icone: Package,       desc: "Sem fonte conectada" },
];

/** Rotas válidas do grupo (app): os 7 hubs setoriais + o Executivo. */
export const ROTAS_HUB = ["executivo", ...HUBS.map((h) => h.key)];

export const acharHub = (chave: string): DefinicaoHub | undefined => HUBS.find((h) => h.key === chave);

/** Primeiro hub que o perfil pode abrir. Admin cai no Executivo. */
export function hubInicial(setores: readonly string[], admin: boolean): string {
  if (admin) return "executivo";
  const primeiro = HUBS.find((h) => setores.includes(h.key));
  return primeiro?.key ?? "";
}
