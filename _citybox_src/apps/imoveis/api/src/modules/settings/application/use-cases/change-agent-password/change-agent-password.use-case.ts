import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvalidCurrentPasswordError } from '../../../domain/errors/invalid-current-password.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { WeakPasswordError } from '../../../domain/errors/weak-password.error';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';
import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
  verifyPassword,
} from '../../policies/password-hash';

export type ChangeAgentPasswordInput = {
  storeId: string;
  agentId: string;
  currentPassword: string;
  newPassword: string;
};

/**
 * A senha atual pode estar como hash (já trocada) ou como a provisória em
 * texto puro (primeiro acesso ainda pendente).
 */
@Injectable()
export class ChangeAgentPasswordUseCase implements IUseCase<
  ChangeAgentPasswordInput,
  void
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: ChangeAgentPasswordInput): Promise<void> {
    const member = await this.members.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!member) {
      throw new TeamMemberNotFoundError(
        ChangeAgentPasswordUseCase.name,
        input.agentId,
      );
    }

    if (
      !this.matchesCurrent(
        member.passwordHash,
        member.temporaryPassword,
        input.currentPassword,
      )
    ) {
      throw new InvalidCurrentPasswordError(
        ChangeAgentPasswordUseCase.name,
        input.agentId,
      );
    }

    if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError(
        ChangeAgentPasswordUseCase.name,
        MIN_PASSWORD_LENGTH,
      );
    }

    await this.members.updateCredentials(input.storeId, input.agentId, {
      passwordHash: hashPassword(input.newPassword),
      temporaryPassword: null,
      mustChangePassword: false,
    });
  }

  private matchesCurrent(
    passwordHash: string | null,
    temporaryPassword: string | null,
    candidate: string,
  ): boolean {
    if (passwordHash) return verifyPassword(candidate, passwordHash);
    if (temporaryPassword) return temporaryPassword === candidate;
    return false;
  }
}
