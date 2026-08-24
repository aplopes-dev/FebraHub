import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { AgentProfileEntity } from '../../../domain/entities/agent-profile.entity';
import type { TeamMemberEntity } from '../../../domain/entities/team-member.entity';
import { AgentProfileRepository } from '../../../domain/repositories/agent-profile.repository.interface';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';

export type GetAgentProfileInput = {
  storeId: string;
  agentId: string;
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  broker: 'Administrador/Corretor',
  affiliated: 'Corretor filiado',
  assistant: 'Assistente',
};

const STANDARD_ROLE_LABELS = new Set(Object.values(ROLE_LABEL));

function seedFromMember(member: TeamMemberEntity | null): {
  name: string;
  email: string;
  phone: string;
  role: string;
} {
  if (!member) {
    return { name: '', email: '', phone: '', role: '' };
  }
  return {
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: ROLE_LABEL[member.role] ?? member.role,
  };
}

function isBlankProfile(profile: AgentProfileEntity): boolean {
  return !profile.name.trim() && !profile.email.trim();
}

/**
 * Cargo em papel padrão do catálogo (Administrador, Administrador/Corretor,
 * Corretor filiado, Assistente) deve refletir o TeamMember — evita badge
 * invertido se o perfil foi seedado errado.
 * Valores free-text (ex.: "Corretora") não são sobrescritos.
 */
function shouldSyncStandardRole(
  currentRole: string,
  expectedRole: string,
): boolean {
  if (!expectedRole) return false;
  const trimmed = currentRole.trim();
  if (!trimmed) return true;
  if (!STANDARD_ROLE_LABELS.has(trimmed)) return false;
  return trimmed !== expectedRole;
}

/**
 * Get-or-create: corretor sem perfil recebe um perfil seedado a partir do
 * TeamMember (nome/e-mail/telefone/papel) quando existir.
 */
@Injectable()
export class GetAgentProfileUseCase implements IUseCase<
  GetAgentProfileInput,
  AgentProfileEntity
> {
  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly teamMembers: TeamMemberRepository,
  ) {}

  async execute(input: GetAgentProfileInput): Promise<AgentProfileEntity> {
    const member = await this.teamMembers.findByAgentId(
      input.storeId,
      input.agentId,
    );
    const seed = seedFromMember(member);
    const existing = await this.profiles.findByAgentId(
      input.storeId,
      input.agentId,
    );

    if (!existing) {
      return this.profiles.upsert(input.storeId, input.agentId, seed);
    }

    if (isBlankProfile(existing) && (seed.name || seed.email)) {
      return this.profiles.upsert(input.storeId, input.agentId, seed);
    }

    if (shouldSyncStandardRole(existing.role, seed.role)) {
      return this.profiles.upsert(input.storeId, input.agentId, {
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        role: seed.role,
        region: existing.region,
        stateId: existing.stateId,
        taxId: existing.taxId,
      });
    }

    return existing;
  }
}
