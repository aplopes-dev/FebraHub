import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';

export type PublicAgentIndexItem = {
  slug: string;
  name: string;
  updatedAt: string | null;
};

export type ListPublicAgentsInput = {
  storeId: string;
};

export type ListPublicAgentsOutput = {
  items: PublicAgentIndexItem[];
};

@Injectable()
export class ListPublicAgentsUseCase implements IUseCase<
  ListPublicAgentsInput,
  ListPublicAgentsOutput
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: ListPublicAgentsInput): Promise<ListPublicAgentsOutput> {
    const all = await this.members.findAll(input.storeId);
    const items = all
      .filter((member) => member.active)
      .map((member) => ({
        slug: member.agentId,
        name: member.name,
        updatedAt: member.lastAccessAt?.toISOString() ?? null,
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    return { items };
  }
}
