export type NavItem = {
  label: string;
  href: string;
};

/** Navegação do painel do corretor (header do dashboard). O painel é a raiz do app. */
export const DASHBOARD_NAV: readonly NavItem[] = [
  { label: 'Painel', href: '/' },
  { label: 'Leads', href: '/leads' },
  { label: 'Imóveis', href: '/properties' },
  { label: 'Transações', href: '/transactions' },
  { label: 'Agenda', href: '/calendar' },
];

/** Página pública do corretor — catálogo divulgado para os clientes. */
export function getAgentCatalogPath(agentSlug: string): string {
  return `/agents/${agentSlug}`;
}

/** Listagem completa de imóveis do catálogo público (“Ver todos”). */
export function getAgentCatalogListingsPath(agentSlug: string): string {
  return `/agents/${agentSlug}/listings`;
}

/** Detalhe público de um imóvel no catálogo do corretor. */
export function getAgentCatalogListingPath(
  agentSlug: string,
  listingId: string,
): string {
  return `/agents/${agentSlug}/listings/${listingId}`;
}

/**
 * Link curto público do imóvel (WhatsApp / OG preview — sem JWT).
 * Query `action=new-lead` destaca o banner de cadastro rápido para corretor logado.
 */
export function getPublicPropertyPath(
  propertyId: string,
  opts?: { action?: 'new-lead' },
): string {
  const base = `/p/${encodeURIComponent(propertyId)}`;
  if (opts?.action === 'new-lead') {
    return `${base}?action=new-lead`;
  }
  return base;
}

/**
 * Rota autenticada de criação de lead com pré-preenchimento via query.
 * Usada pelo interceptor do link público `/p/:id?action=new-lead` (corretor logado).
 */
export function getNewLeadPath(opts: {
  propertyId: string;
  name?: string;
  phone?: string;
  /** Origem do fluxo (ex.: `whatsapp`). */
  source?: string;
}): string {
  const q = new URLSearchParams();
  q.set('propertyId', opts.propertyId);
  const name = opts.name?.trim();
  const phone = opts.phone?.trim();
  const source = opts.source?.trim();
  if (name) q.set('name', name);
  if (phone) q.set('phone', phone);
  if (source) q.set('source', source);
  return `/leads/new?${q.toString()}`;
}
