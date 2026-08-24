import {
  permissionsForRole,
  type TeamMemberRole,
} from '../../domain/entities/team-member.entity';
import type { TeamMemberCreatePayload } from '../../domain/repositories/team-member.repository.interface';

type DefaultMember = {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  role: TeamMemberRole;
  initials: string;
  lastAccessAt: string;
};

/** Mesmos usuários de `DEFAULT_USERS` no web. */
const DEFAULT_MEMBERS: readonly DefaultMember[] = [
  {
    agentId: 'ana-helena',
    name: 'Ana Helena Ribeiro',
    email: 'ana.ribeiro@imoveis.com.br',
    phone: '(41) 99820-4417',
    role: 'admin',
    initials: 'AH',
    lastAccessAt: '2025-06-13',
  },
  {
    agentId: 'bruno-costa',
    name: 'Bruno Costa',
    email: 'bruno.costa@imoveis.com.br',
    phone: '(41) 99102-8831',
    role: 'broker',
    initials: 'BC',
    lastAccessAt: '2025-06-12',
  },
  {
    agentId: 'carla-mendes',
    name: 'Carla Mendes',
    email: 'carla.mendes@imoveis.com.br',
    phone: '(41) 99744-5510',
    role: 'assistant',
    initials: 'CM',
    lastAccessAt: '2025-06-10',
  },
];

/** Semente usada quando a loja ainda não tem nenhum usuário cadastrado. */
export function defaultTeamMemberPayloads(): TeamMemberCreatePayload[] {
  return DEFAULT_MEMBERS.map((member) => ({
    agentId: member.agentId,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    initials: member.initials,
    active: true,
    permissions: permissionsForRole(member.role),
    lastAccessAt: new Date(`${member.lastAccessAt}T00:00:00.000Z`),
    passwordHash: null,
    temporaryPassword: null,
    mustChangePassword: false,
  }));
}
