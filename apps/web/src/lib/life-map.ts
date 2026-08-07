/**
 * Alex's life map: the radial taxonomy at the heart of the OS.
 * Center = Alex's life; ring 1 = color-coded life areas; ring 2 = the
 * modules inside each area. Communication additionally carries the contact
 * tier system — the numbered/colored response-priority ladder for people.
 *
 * This is the one place colors enter the otherwise black & white OS:
 * each life area owns a hue, and everything underneath inherits it.
 */
import type { LifeMap, LifeMapNode } from '@/lib/schemas';

export type LifeModule = { id: string; label: string; detail: string };

export type LifeArea = {
  id: string;
  label: string;
  color: string;
  detail: string;
  modules: LifeModule[];
  agents: string[]; // RuntimeAgent ids working this area
  brainFolders: string[]; // brain-store folders feeding this area
  departmentIds: string[]; // seeded departments that roll up to this area
};

export const LIFE_AREAS: LifeArea[] = [
  {
    id: 'marketing',
    label: 'Marketing',
    color: '#f59e0b',
    detail: 'Tudo que conquista atenção.',
    modules: [
      { id: 'content', label: 'Conteúdo', detail: 'Posts, roteiros e criativos em IG/TikTok/YT/X.' },
      { id: 'email', label: 'E-mail', detail: 'Campanhas e sequências.' },
      { id: 'newsletter', label: 'Newsletter', detail: 'O envio recorrente para audiência própria.' },
      { id: 'sms', label: 'SMS', detail: 'Disparos e lembretes por texto.' },
      { id: 'editing', label: 'Edição', detail: 'Cortes, legendas e pós-produção.' },
    ],
    agents: ['social-agent', 'zernio-publisher', 'arcads-creative', 'remotion-editor', 'higgsfield-creative', 'manychat-mcp', 'social-pulse'],
    brainFolders: ['media', 'writing', 'ideas'],
    departmentIds: ['dept-marketing-growth'],
  },
  {
    id: 'sales',
    label: 'Vendas',
    color: '#ef4444',
    detail: 'Deals, pipeline e relações de receita.',
    modules: [
      { id: 'pipeline', label: 'Pipeline', detail: 'Deals ativos e estágios.' },
      { id: 'crm', label: 'CRM', detail: 'Pessoas, empresas e histórico de contas.' },
      { id: 'follow-up', label: 'Follow-up', detail: 'Próximas ações e lembretes.' },
      { id: 'offers', label: 'Ofertas', detail: 'Propostas, pricing e caminhos de fechamento.' },
    ],
    agents: [
      'sales-agent',
      'crm-pulse',
      'launchpad-cohort-sales',
      'vantage-sales',
      'fanbasis-sales',
      'vantage-fanbasis',
      'stripe-sales',
      'processor-confirmation',
      'pava-financing',
      'sales-calls-data',
    ],
    brainFolders: ['people', 'companies', 'hiring'],
    departmentIds: ['dept-sales'],
  },
  {
    id: 'finances',
    label: 'Finanças',
    color: '#22c55e',
    detail: 'Dinheiro entrando, saindo, todo processador.',
    modules: [
      { id: 'payments', label: 'Pagamentos', detail: 'Stripe + registro de processadores.' },
      { id: 'invoicing', label: 'Faturamento', detail: 'O que é devido e por quem.' },
      { id: 'subscriptions', label: 'Assinaturas', detail: 'Receita recorrente e churn.' },
      { id: 'bookkeeping', label: 'Contabilidade', detail: 'Categorizado, reconciliado, pronto para imposto.' },
    ],
    agents: ['payments-pulse'],
    brainFolders: ['companies'],
    departmentIds: ['dept-finance'],
  },
  {
    id: 'communication',
    label: 'Comunicação',
    color: '#3b82f6',
    detail: 'Toda pessoa, todo canal, uma escada de prioridade.',
    modules: [
      {
        id: 'client-management',
        label: 'Gestão de clientes',
        detail: 'Pessoas tagueadas com tiers de resposta — quem precisa de resposta ASAP.',
      },
      { id: 'inbox', label: 'Caixa de entrada', detail: '4 caixas IMAP, unificadas.' },
      { id: 'whatsapp', label: 'WhatsApp', detail: '611 chats do ChatStorage local.' },
      { id: 'slack', label: 'Slack', detail: 'Mensagens e menções do workspace.' },
      { id: 'meetings', label: 'Reuniões', detail: 'Notas e follow-ups.' },
    ],
    agents: ['comms-agent', 'gmail-worker', 'whatsapp-worker', 'slack-worker'],
    brainFolders: ['inbox', 'meetings', 'people'],
    departmentIds: ['dept-comms'],
  },
  {
    id: 'clients',
    label: 'Clientes',
    color: '#14b8a6',
    detail: 'Todo cliente, onboardado e atendido.',
    modules: [
      { id: 'roster', label: 'Roster', detail: 'Quem é cliente agora, por venture.' },
      { id: 'onboarding', label: 'Onboarding', detail: 'Closed-won até kickoff sem passo perdido.' },
      { id: 'service', label: 'Atendimento', detail: 'Cadência de check-in e tracking de entregáveis.' },
      { id: 'renewals', label: 'Renovações', detail: 'Timing de expansão e renovação.' },
    ],
    agents: ['client-roster', 'client-onboarding', 'client-success'],
    brainFolders: ['people', 'companies'],
    departmentIds: ['dept-clients'],
  },
  {
    id: 'knowledge',
    label: 'Conhecimento',
    color: '#a855f7',
    detail: 'G-Brain: markdown, vetores e recall.',
    modules: [
      { id: 'brain-store', label: 'Brain store', detail: 'Markdown como fonte da verdade no disco.' },
      { id: 'vector-db', label: 'Vector DB', detail: 'Chunks → embeddings → pgvector.' },
      { id: 'prompts', label: 'Prompts', detail: 'Biblioteca reutilizável de prompts.' },
      { id: 'sources', label: 'Fontes', detail: 'Material de referência e citações.' },
    ],
    agents: ['data-agent', 'markdown-auditor', 'vector-auditor', 'notion-sync', 'brain-librarian'],
    brainFolders: ['concepts', 'prompts', 'sources', 'archive'],
    departmentIds: ['dept-tech'],
  },
  {
    id: 'operations',
    label: 'Operações',
    color: '#fafafa',
    detail: 'A máquina que roda a máquina.',
    modules: [
      { id: 'agents', label: 'Agentes', detail: 'O roster e sua hierarquia.' },
      { id: 'automations', label: 'Automações', detail: 'Jobs agendados e self-healing.' },
      { id: 'infra', label: 'Infra', detail: 'Stack local, portas, alvo Mac mini.' },
      { id: 'hiring', label: 'Contratação', detail: 'Candidatos e vagas.' },
    ],
    // dept-tech rolls up to knowledge first (lifeAreaForDepartment takes the
    // first match); operations still owns the conductor + stack agents.
    agents: ['conductor', 'stack-monitor'],
    brainFolders: ['org', 'projects', 'hiring'],
    departmentIds: ['dept-tech'],
  },
];

export type ContactTier = {
  tier: number;
  label: string;
  color: string;
  respond: string;
  tags: string[];
};

/**
 * The response-priority ladder for people Alex talks to.
 * 1 = red (clients & students), 2 = yellow (brand), 3 = green (personal).
 * Specific people get overrides via the contact_tags table.
 */
export const CONTACT_TIERS: ContactTier[] = [
  { tier: 1, label: 'Prioridade 1', color: '#ef4444', respond: 'ASAP', tags: ['client', 'student'] },
  { tier: 2, label: 'Prioridade 2', color: '#eab308', respond: 'no mesmo dia', tags: ['brand', 'partner', 'lead'] },
  { tier: 3, label: 'Prioridade 3', color: '#22c55e', respond: 'quando der', tags: ['personal', 'friend', 'community'] },
];

export function lifeAreaForDepartment(departmentId: string): LifeArea | null {
  return LIFE_AREAS.find((a) => a.departmentIds.includes(departmentId)) ?? null;
}

export function buildLifeMap(): LifeMap {
  const nodes: LifeMapNode[] = [
    {
      id: 'center',
      type: 'center',
      label: 'Vida do Alex',
      color: '#fafafa',
      parent: null,
      detail: 'O núcleo. Tudo orbita isso.',
      agents: [],
      brainFolders: [],
    },
  ];
  const edges: LifeMap['edges'] = [];

  for (const area of LIFE_AREAS) {
    nodes.push({
      id: area.id,
      type: 'area',
      label: area.label,
      color: area.color,
      parent: 'center',
      detail: area.detail,
      agents: area.agents,
      brainFolders: area.brainFolders,
    });
    edges.push({ source: 'center', target: area.id });

    for (const mod of area.modules) {
      const id = `${area.id}/${mod.id}`;
      nodes.push({
        id,
        type: 'module',
        label: mod.label,
        color: area.color,
        parent: area.id,
        detail: mod.detail,
        agents: [],
        brainFolders: [],
      });
      edges.push({ source: area.id, target: id });
    }
  }

  // the contact priority ladder hangs off client management
  for (const t of CONTACT_TIERS) {
    const id = `tier-${t.tier}`;
    nodes.push({
      id,
      type: 'tier',
      label: `T${t.tier} ${t.label}`,
      color: t.color,
      parent: 'communication/client-management',
      detail: `${t.tags.join(', ')} — responder ${t.respond}`,
      agents: [],
      brainFolders: [],
    });
    edges.push({ source: 'communication/client-management', target: id });
  }

  return { nodes, edges };
}
