import type { TeamMemberRepository } from '../../../settings/domain/repositories/team-member.repository.interface';
import { PublicAgentNotFoundError } from '../../domain/errors/public-agent-not-found.error';

/**
 * Resolve a loja do catálogo público a partir do slug (`TeamMember.agentId`).
 *
 * - 0 ativos → 404
 * - 1 ativo → essa loja
 * - N ativos (colisão entre organizations) → prefer `preferredStoreId` se bater;
 *   senão usa o mais antigo (criação) para estabilidade do link `/agents/:slug`
 */
export async function resolvePublicAgentStoreId(
  members: TeamMemberRepository,
  slug: string,
  context: string,
  preferredStoreId?: string,
): Promise<string> {
  const trimmed = slug.trim();
  if (!trimmed) {
    throw new PublicAgentNotFoundError(context, trimmed);
  }

  const matches = await members.findActiveByAgentIdGlobal(trimmed);
  if (matches.length === 0) {
    throw new PublicAgentNotFoundError(context, trimmed);
  }

  if (matches.length === 1) {
    return matches[0].storeId;
  }

  const preferred = preferredStoreId?.trim();
  if (preferred) {
    const hit = matches.find((member) => member.storeId === preferred);
    if (hit) return hit.storeId;
  }

  return matches[0].storeId;
}
