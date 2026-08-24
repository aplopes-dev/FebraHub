/** Corretores mockados — fallback legado; preferir `GET /v1/settings/users`. */

import { findTeamMember } from '@/features/settings/data/team-members-cache';

export type TeamAgent = {
  id: string;
  name: string;
  initials: string;
};

export const TEAM_AGENTS: readonly TeamAgent[] = [
  { id: 'ana-helena', name: 'Ana Helena Ribeiro', initials: 'AH' },
  { id: 'bruno-costa', name: 'Bruno Costa', initials: 'BC' },
  { id: 'carla-mendes', name: 'Carla Mendes', initials: 'CM' },
] as const;

export function getTeamAgent(id: string): TeamAgent | undefined {
  const fromApi = findTeamMember(id);
  if (fromApi) {
    return { id: fromApi.id, name: fromApi.name, initials: fromApi.initials };
  }
  return TEAM_AGENTS.find((agent) => agent.id === id);
}

export function getTeamAgentName(id: string): string {
  return findTeamMember(id)?.name ?? TEAM_AGENTS.find((agent) => agent.id === id)?.name ?? id;
}

/** Identidade do corretor logado no mock (alinhada ao catálogo público). */
export const CURRENT_AGENT_ID = 'ana-helena';

/** Outro corretor no seed — imóveis/leads dele aparecem só nas listagens gerais. */
export const OTHER_AGENT_ID = 'bruno-costa';

export const AGENT_DISPLAY_NAME: Record<string, string> = {
  [CURRENT_AGENT_ID]: 'Ana Helena',
  [OTHER_AGENT_ID]: 'Bruno Costa',
};

export const AGENT_SHORT_NAME: Record<string, string> = {
  [CURRENT_AGENT_ID]: 'Ana H.',
  [OTHER_AGENT_ID]: 'Bruno C.',
};

export function getAgentDisplayName(agentId?: string): string {
  if (!agentId) return 'Sem corretor';
  return AGENT_DISPLAY_NAME[agentId] ?? getTeamAgentName(agentId);
}

export function getAgentShortName(agentId?: string): string {
  if (!agentId) return '—';
  return AGENT_SHORT_NAME[agentId] ?? getTeamAgent(agentId)?.initials ?? agentId;
}
