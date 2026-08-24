/**
 * Variante do tema de login — define **qual sistema** o usuário está acessando.
 *
 * ## A fonte da variante é o realm
 *
 * Com um realm por sistema (ADR C-16), o realm **é** o sistema — o realm
 * `citybox-clinica` só hospeda usuários da clínica. Derivar do realm é direto
 * e não depende de cada client apontar um tema próprio: todos os realms usam o
 * mesmo `loginTheme: "citybox"` e a identidade visual muda em runtime.
 *
 * A query `?variant=` serve ao preview de DEV (mock, sem Keycloak).
 *
 * ## White-label: sem cor por sistema (2026-08-14)
 *
 * Os sistemas são white-label — a cor primária é a cor de brand da
 * ORGANIZAÇÃO (aplicada dentro do app), então o login é neutro em todos.
 * A variante define apenas `label`, `layout` e o conteúdo do painel.
 */
export type ThemeVariant =
  | "admin"
  | "erp"
  | "clinica"
  | "beautiful"
  | "imoveis"
  | "marketplace";

type VariantSlide = {
  /** Etiqueta acima do título. */
  tag: string;
  title: string;
  description: string;
  /** Destaques do sistema; 4–6 itens cabem sem rolagem no painel. */
  features?: string[];
  stats?: Array<{ value: string; label: string }>;
};

/**
 * Layout da tela — é O diferenciador visual entre os sistemas (white-label):
 * - `split-right`: form à esquerda, painel ilustrativo à direita
 * - `split-left`:  painel à esquerda, form à direita
 * - `centered`:    form centralizado, sem painel
 * - `panel-card`:  card flutuante sobre o painel escuro em tela cheia
 */
export type VariantLayout =
  | "split-right"
  | "split-left"
  | "centered"
  | "panel-card";

type ThemeVariantConfig = {
  /** Nome da vertical, exibido em destaque ao lado do logo CityBox. */
  label: string;
  /** Layout da tela — ver `VariantLayout`. */
  layout: VariantLayout;
  slides: VariantSlide[];
};

/**
 * White-label (2026-08-14): a cor primária pertence à ORGANIZAÇÃO, não ao
 * sistema — o login é neutro em todos. O que diferencia um sistema do outro é
 * o **layout** + o nome da vertical em destaque ao lado do logo CityBox.
 */
export const THEME_VARIANTS: Record<ThemeVariant, ThemeVariantConfig> = {
  admin: {
    label: "Admin da Plataforma",
    layout: "centered",
    slides: [
      {
        tag: "CityBox · Admin da Plataforma",
        title: "A operação do ecossistema, num lugar só",
        description:
          "Cadastro de clientes, planos, assinaturas e faturamento de todos os sistemas do CityBox.",
        stats: [
          { value: "5", label: "sistemas" },
          { value: "1", label: "painel" },
        ],
        features: [
          "Cadastro de organizações e lojas por vertical",
          "Planos, assinaturas e faturas",
          "Provisionamento automático do responsável",
          "Acompanhamento do status de implantação",
        ],
      },
    ],
  },
  erp: {
    label: "Comércio",
    layout: "split-right",
    slides: [
      {
        tag: "CityBox · Comércio",
        title: "Do balcão ao estoque, sem planilha",
        description:
          "PDV, catálogo, estoque, vendas e financeiro conectados — food e varejo no mesmo sistema.",
        stats: [
          { value: "PDV", label: "rápido e offline-ready" },
          { value: "360°", label: "do produto ao caixa" },
        ],
        features: [
          "Ponto de venda com código de barras e balança",
          "Catálogo com variações, ficha técnica e preços",
          "Estoque com inventário, compras e transferências",
          "Financeiro com conciliação bancária e DRE",
          "Emissão fiscal integrada",
        ],
      },
    ],
  },
  clinica: {
    label: "Clínica",
    layout: "split-left",
    slides: [
      {
        tag: "CityBox · Clínica",
        title: "Sua clínica organizada de ponta a ponta",
        description:
          "Agenda, prontuário, anamnese e planos de tratamento num fluxo só — do primeiro contato ao pós-atendimento.",
        stats: [
          { value: "0", label: "papel na recepção" },
          { value: "100%", label: "histórico do paciente" },
        ],
        features: [
          "Agenda por profissional e por sala",
          "Prontuário e anamnese digitais",
          "Planos de tratamento e orçamentos",
          "Controle de convênios e particulares",
          "Financeiro integrado ao atendimento",
        ],
      },
    ],
  },
  beautiful: {
    label: "Beautiful",
    layout: "panel-card",
    slides: [
      {
        tag: "CityBox · Beautiful",
        title: "Salão cheio, agenda no controle",
        description:
          "Agendamento, comissões, comandas e fidelização — pensado para salão, barbearia e estética.",
        stats: [
          { value: "1 min", label: "para agendar" },
          { value: "auto", label: "cálculo de comissão" },
        ],
        features: [
          "Agenda por profissional com bloqueios",
          "Serviços, pacotes e produtos na mesma comanda",
          "Comissão calculada no fechamento",
          "Ficha do cliente com histórico e preferências",
          "Financeiro e estoque de produtos",
        ],
      },
    ],
  },
  imoveis: {
    label: "Imóveis",
    layout: "split-right",
    slides: [
      {
        tag: "CityBox · Imóveis",
        title: "Do lead à chave na mão",
        description:
          "Carteira de imóveis, funil de leads, visitas e contratos — com o corretor certo em cada etapa.",
        stats: [
          { value: "CRM", label: "do lead ao negócio" },
          { value: "1", label: "carteira viva" },
        ],
        features: [
          "Carteira de imóveis com fotos e documentos",
          "Funil de leads com corretor responsável",
          "Agendamento e histórico de visitas",
          "Propostas, contratos e comissões",
          "Site de anúncios sincronizado",
        ],
      },
    ],
  },
  marketplace: {
    label: "Marketplace",
    layout: "panel-card",
    slides: [
      {
        tag: "CityBox · Marketplace",
        title: "A sua cidade, na palma da mão",
        description:
          "Peça de restaurantes, lojas e serviços da sua cidade — tudo num app só, com entrega e retirada.",
        stats: [
          { value: "1", label: "app para tudo" },
          { value: "local", label: "comércio da cidade" },
        ],
        features: [
          "Restaurantes, mercados e lojas da região",
          "Entrega ou retirada, você escolhe",
          "Acompanhe o pedido em tempo real",
          "Pagamento no app ou na entrega",
        ],
      },
    ],
  },
};

/**
 * Realm → variante. Chave é o nome do realm no Keycloak (ADR C-16 §2.1).
 *
 * Realm não listado cai no `admin`, que é o padrão mais conservador: mostra a
 * marca sem prometer um produto que o usuário talvez não esteja acessando.
 */
const VARIANT_BY_REALM: Record<string, ThemeVariant> = {
  "citybox-admin": "admin",
  "citybox-erp": "erp",
  "citybox-clinica": "clinica",
  "citybox-beautiful": "beautiful",
  "citybox-imoveis": "imoveis",
  "citybox-marketplace": "marketplace",
};

type ThemeVariantContext = {
  realm?: { name?: string };
  themeName?: string;
};

/** Resolve a variante: realm → themeName (legado) → query (DEV) → admin. */
export function getThemeVariant(kcContext: ThemeVariantContext): ThemeVariant {
  const realmName = kcContext.realm?.name ?? "";
  const byRealm = VARIANT_BY_REALM[realmName];
  if (byRealm) return byRealm;

  // Fallback por `themeName`, para realm ainda não migrado ao ADR C-16.
  const themeName = kcContext.themeName ?? "";
  for (const variant of Object.keys(THEME_VARIANTS) as ThemeVariant[]) {
    if (themeName.includes(variant)) return variant;
  }

  // DEV preview (mock, sem Keycloak): ?variant=clinica etc.
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("variant");
    if (q && q in THEME_VARIANTS) return q as ThemeVariant;
  }

  return "admin";
}
