import type { TeamMemberEntity } from '../../../settings/domain/entities/team-member.entity';

/**
 * Dono-alvo de inventário órfão/legado do catálogo: só admins ativos.
 * Corretores não recebem repasse automático (evita esvaziar o catálogo do admin).
 */
export function resolveCatalogOrphanAssignAgentIds(
  members: readonly TeamMemberEntity[],
): string[] {
  return [
    ...new Set(
      members
        .filter((member) => member.active && member.role === 'admin')
        .map((member) => member.agentId.trim())
        .filter(Boolean),
    ),
  ].sort();
}

/** AgentIds da equipe ativa — donos legítimos de carteira. */
export function resolveCatalogValidAgentIds(
  members: readonly TeamMemberEntity[],
): string[] {
  return [
    ...new Set(
      members
        .filter((member) => member.active)
        .map((member) => member.agentId.trim())
        .filter(Boolean),
    ),
  ].sort();
}

/** Membros ativos que não são admin (legado — round-robin / migrations). */
export function resolveCatalogNonAdminAgentIds(
  members: readonly TeamMemberEntity[],
): string[] {
  return [
    ...new Set(
      members
        .filter((member) => member.active && member.role !== 'admin')
        .map((member) => member.agentId.trim())
        .filter(Boolean),
    ),
  ].sort();
}
