import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { TeamMemberEntity } from '../../../domain/entities/team-member.entity';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import { defaultTeamMemberPayloads } from '../../policies/default-team-members';

export type ListTeamMembersInput = {
  storeId: string;
};

/** Get-or-seed: a primeira leitura da loja materializa a equipe padrão. */
@Injectable()
export class ListTeamMembersUseCase implements IUseCase<
  ListTeamMembersInput,
  TeamMemberEntity[]
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: ListTeamMembersInput): Promise<TeamMemberEntity[]> {
    const existing = await this.members.findAll(input.storeId);
    if (existing.length > 0) return existing;

    for (const payload of defaultTeamMemberPayloads()) {
      await this.members.create(input.storeId, payload);
    }
    return this.members.findAll(input.storeId);
  }
}
