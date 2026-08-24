import type { TeamMemberEntity } from '../../../settings/domain/entities/team-member.entity';
import { TeamMemberRepository } from '../../../settings/domain/repositories/team-member.repository.interface';
import { PublicAgentNotFoundError } from '../../domain/errors/public-agent-not-found.error';

export async function resolveActivePublicAgent(
  members: TeamMemberRepository,
  storeId: string,
  slug: string,
  context: string,
): Promise<TeamMemberEntity> {
  const trimmed = slug.trim();
  const member = await members.findByAgentId(storeId, trimmed);
  if (!member?.active) {
    throw new PublicAgentNotFoundError(context, trimmed);
  }
  return member;
}
