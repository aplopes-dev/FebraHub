import { CURRENT_AGENT_ID, OTHER_AGENT_ID } from '@/features/shared/constants/agents';
import type { SessionUser } from '../types';

/** Perfis mock para alternar sessão no UserMenu. */
export const SESSION_PRESETS: readonly SessionUser[] = [
  {
    id: CURRENT_AGENT_ID,
    name: 'Ana Helena Ribeiro',
    initials: 'AH',
    email: 'ana.ribeiro@imoveis.com.br',
    role: 'ADMIN',
    organization: {
      id: 'org-imobiliaria-ribeiro',
      name: 'Imobiliária Ribeiro',
      type: 'AGENCY',
    },
  },
  {
    id: 'carla-mendes',
    name: 'Carla Mendes',
    initials: 'CM',
    email: 'carla.mendes@imoveis.com.br',
    role: 'MANAGER',
    organization: {
      id: 'org-imobiliaria-ribeiro',
      name: 'Imobiliária Ribeiro',
      type: 'AGENCY',
    },
  },
  {
    id: OTHER_AGENT_ID,
    name: 'Bruno Costa',
    initials: 'BC',
    email: 'bruno.costa@imoveis.com.br',
    role: 'AGENT',
    organization: {
      id: 'org-imobiliaria-ribeiro',
      name: 'Imobiliária Ribeiro',
      type: 'AGENCY',
    },
  },
  {
    id: 'lucas-autonomo',
    name: 'Lucas Ferreira',
    initials: 'LF',
    email: 'lucas.ferreira@corretor.com.br',
    role: 'AUTONOMOUS',
    organization: {
      id: 'org-lucas-ferreira',
      name: 'Lucas Ferreira — Corretor',
      type: 'SINGLE_AGENT',
    },
  },
] as const;

export const DEFAULT_SESSION_USER = SESSION_PRESETS[0];
