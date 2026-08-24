import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MemberNotInStoreError } from '../../../domain/errors/member.errors';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import {
  PROVISIONAL_PASSWORD_TTL_MS,
  generateProvisionalPassword,
} from '../../../../../shared/infra/keycloak/provisional-password';

export type ResetMemberPasswordInput = {
  storeId: string;
  memberId: string;
};

export type ResetMemberPasswordResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Gera senha provisória de um membro da loja (equipe).
 * `POST /v1/members/:id/reset-password`.
 */
@Injectable()
export class ResetMemberPasswordUseCase implements IUseCase<
  ResetMemberPasswordInput,
  ResetMemberPasswordResult
> {
  constructor(
    private readonly members: MemberRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(
    input: ResetMemberPasswordInput,
  ): Promise<ResetMemberPasswordResult> {
    const member = await this.members.findInStore(
      input.storeId,
      input.memberId,
    );
    if (!member) {
      throw new MemberNotInStoreError(
        ResetMemberPasswordUseCase.name,
        input.storeId,
        input.memberId,
      );
    }

    const provisionalPassword = generateProvisionalPassword();
    await this.identityProvider.setProvisionalPassword(
      member.keycloakSub,
      provisionalPassword,
    );
    await this.members.markProvisionalPassword(
      member.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );

    return {
      username: member.username,
      provisionalPassword,
    };
  }
}
