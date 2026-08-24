import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../domain/repositories/membership.repository.interface';
import { LastOwnerForbiddenError } from '../../../domain/errors/last-owner-forbidden.error';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import type { RemoveMemberDto } from '../../dtos/member.dto';

/**
 * Remove o vínculo com a organização.
 *
 * Só o vínculo: a identidade no Keycloak e o `User` local sobrevivem, porque a
 * mesma pessoa pode ser membro de outras empresas.
 */
@Injectable()
export class RemoveMemberUseCase implements IUseCase<RemoveMemberDto, void> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(input: RemoveMemberDto): Promise<void> {
    const detail = await this.membershipRepository.findById(
      input.organizationId,
      input.membershipId,
    );
    if (!detail) throw new MembershipNotFoundError(input.membershipId);

    if (detail.membership.isOwner && detail.membership.active) {
      const owners = await this.membershipRepository.countActiveOwners(
        input.organizationId,
      );
      if (owners <= 1) throw new LastOwnerForbiddenError(input.organizationId);
    }

    await this.membershipRepository.delete(
      input.organizationId,
      input.membershipId,
    );
  }
}
