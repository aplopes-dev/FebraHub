import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { generateProvisionalPassword } from '../../../../../shared/infra/keycloak/provisional-password';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import type {
  ResetMemberPasswordDto,
  ResetMemberPasswordResult,
} from '../../dtos/member.dto';

/**
 * Gera uma nova senha de primeiro acesso para um membro que perdeu a dele.
 *
 * O `membershipId` — e não o `sub` — é a entrada: assim só quem administra a
 * organização a que a pessoa pertence consegue redefinir a senha dela.
 */
@Injectable()
export class ResetMemberPasswordUseCase implements IUseCase<
  ResetMemberPasswordDto,
  ResetMemberPasswordResult
> {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(
    input: ResetMemberPasswordDto,
  ): Promise<ResetMemberPasswordResult> {
    const detail = await this.membershipRepository.findById(
      input.organizationId,
      input.membershipId,
    );
    if (!detail) throw new MembershipNotFoundError(input.membershipId);

    const provisionalPassword = generateProvisionalPassword();
    await this.identityProvider.setProvisionalPassword(
      detail.user.keycloakSub,
      provisionalPassword,
    );

    return { email: detail.user.email, provisionalPassword };
  }
}
