import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { TeamMemberEntity } from '../../../domain/entities/team-member.entity';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { WeakPasswordError } from '../../../domain/errors/weak-password.error';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
} from '../../policies/password-hash';

export type CompleteFirstLoginInput = {
  storeId: string;
  agentId: string;
  newPassword: string;
};

/** Primeiro acesso: troca a senha provisória sem exigir a senha atual. */
@Injectable()
export class CompleteFirstLoginUseCase implements IUseCase<
  CompleteFirstLoginInput,
  TeamMemberEntity
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: CompleteFirstLoginInput): Promise<TeamMemberEntity> {
    const member = await this.members.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!member) {
      throw new TeamMemberNotFoundError(
        CompleteFirstLoginUseCase.name,
        input.agentId,
      );
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError(
        CompleteFirstLoginUseCase.name,
        MIN_PASSWORD_LENGTH,
      );
    }

    const updated = await this.members.updateCredentials(
      input.storeId,
      input.agentId,
      {
        passwordHash: hashPassword(input.newPassword),
        temporaryPassword: null,
        mustChangePassword: false,
      },
    );
    if (!updated) {
      throw new TeamMemberNotFoundError(
        CompleteFirstLoginUseCase.name,
        input.agentId,
      );
    }
    return updated;
  }
}
