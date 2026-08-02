import {
  CalendarDays, GraduationCap, Handshake, Megaphone, Package, Plug, ShoppingBag, TrendingUp, Wallet,
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
  // Fase 2/Etapa 1 da integração (docs/INTEGRACAO_HUB_CRM.md): rota estática
  // própria (aba/cliente/negócio na query), mas entra em HUBS para o menu
  // Setores e para o gating por setor funcionarem como nos demais.
  { key: "crm",        nome: "CRM",        Icone: Handshake,     desc: "Clientes, funil de vendas e tarefas" },
];

/* Página do grupo (app) que NÃO é hub de BI: entra na sidebar por conta
   própria (só para admin) e tem rota estática, não `/[hub]`. Fica FORA de
   HUBS e de ROTAS_HUB de propósito — em HUBS ela apareceria na lista de
   setores de todo mundo, e em ROTAS_HUB a rota dinâmica passaria a aceitar
   /integracoes. O que ela precisa daqui é só nome e descrição, que o
   cabeçalho do Shell lê por `acharHub`. */
export const PAGINA_INTEGRACOES: DefinicaoHub = {
  key: "integracoes",
  nome: "Integrações",
  Icone: Plug,
  desc: "Conexões das fontes externas e validade dos tokens",
};

/** Rotas válidas do grupo (app): os 7 hubs setoriais + o Executivo. */
export const ROTAS_HUB = ["executivo", ...HUBS.map((h) => h.key)];

export const acharHub = (chave: string): DefinicaoHub | undefined =>
  HUBS.find((h) => h.key === chave) ??
  (chave === PAGINA_INTEGRACOES.key ? PAGINA_INTEGRACOES : undefined);

/** Primeiro hub que o perfil pode abrir. Admin cai no Executivo. */
export function hubInicial(setores: readonly string[], admin: boolean): string {
  if (admin) return "executivo";
  const primeiro = HUBS.find((h) => setores.includes(h.key));
  return primeiro?.key ?? "";
}
