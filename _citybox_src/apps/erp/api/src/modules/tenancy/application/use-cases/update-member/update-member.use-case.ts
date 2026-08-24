import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import {
  MembershipRepository,
  type MembershipDetail,
} from '../../../domain/repositories/membership.repository.interface';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import { LastOwnerForbiddenError } from '../../../domain/errors/last-owner-forbidden.error';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';
import { MembershipPdvCodeTakenError } from '../../../domain/errors/membership-pdv-code-taken.error';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import type { UpdateMemberDto } from '../../dtos/member.dto';

/**
 * Muda papel, situação, perfil de acesso, filiais e código PDV de um membro.
 *
 * Rebaixar ou desativar é tratado como remover para efeito da regra do último
 * responsável: o resultado prático é o mesmo — a organização ficaria sem quem
 * a administre.
 */
@Injectable()
export class UpdateMemberUseCase implements IUseCase<
  UpdateMemberDto,
  MembershipDetail
> {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly branchRepository: BranchRepository,
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(input: UpdateMemberDto): Promise<MembershipDetail> {
    const detail = await this.membershipRepository.findById(
      input.organizationId,
      input.membershipId,
    );
    if (!detail) throw new MembershipNotFoundError(input.membershipId);

    const role = input.role ?? detail.membership.role;
    const active = input.active ?? detail.membership.active;
    const permissionProfileId =
      input.permissionProfileId === undefined
        ? detail.membership.permissionProfileId
        : await this.resolveProfileId(
            input.organizationId,
            input.permissionProfileId,
          );

    const losesOwner =
      detail.membership.isOwner &&
      detail.membership.active &&
      (role !== 'OWNER' || !active);
    if (losesOwner) {
      const owners = await this.membershipRepository.countActiveOwners(
        input.organizationId,
      );
      if (owners <= 1) throw new LastOwnerForbiddenError(input.organizationId);
    }

    if (input.pdvCode !== undefined) {
      const nextCode = input.pdvCode?.trim() || null;
      if (nextCode) {
        const conflict = await this.membershipRepository.findByPdvCode(
          input.organizationId,
          nextCode,
        );
        if (conflict && conflict.membership.id !== detail.membership.id) {
          throw new MembershipPdvCodeTakenError(nextCode);
        }
      }
    }

    const updated = await this.membershipRepository.save(
      detail.membership.update({
        role,
        active,
        permissionProfileId,
        pdvCode: input.pdvCode,
        isSeller: input.isSeller,
      }),
    );

    // OWNER/ADMIN acessam tudo por definição: manter uma lista explícita criaria
    // a ilusão de restrição que o guard não aplica. A limpeza acontece na
    // promoção mesmo sem `branchIds` no corpo — senão, promover um MEMBER que
    // tinha acesso a duas unidades deixaria essas linhas para trás, e o
    // rebaixamento futuro as ressuscitaria em silêncio.
    if (updated.hasImplicitAccessToAllBranches) {
      if (detail.branchIds.length > 0) {
        await this.membershipRepository.replaceBranchAccess(
          input.organizationId,
          updated.id,
          [],
        );
      }
    } else if (input.branchIds !== undefined) {
      const branchIds = await this.validateBranches(
        input.organizationId,
        input.branchIds,
      );
      await this.membershipRepository.replaceBranchAccess(
        input.organizationId,
        updated.id,
        branchIds,
      );
    }

    const refreshed = await this.membershipRepository.findById(
      input.organizationId,
      updated.id,
    );
    if (!refreshed) throw new MembershipNotFoundError(updated.id);
    return refreshed;
  }

  private async resolveProfileId(
    organizationId: string,
    profileId: string,
  ): Promise<string> {
    const profile = await this.permissionProfileRepository.findById(
      organizationId,
      profileId,
    );
    if (!profile || profile.deletedAt) {
      throw new PermissionProfileNotFoundError(profileId);
    }
    return profile.id;
  }

  private async validateBranches(
    organizationId: string,
    branchIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(branchIds.filter(Boolean))];
    for (const branchId of unique) {
      const branch = await this.branchRepository.findById(
        organizationId,
        branchId,
      );
      if (!branch || branch.deletedAt) throw new BranchNotFoundError(branchId);
    }
    return unique;
  }
}
