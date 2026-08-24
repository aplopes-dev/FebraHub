import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import type { SyncTerminalOperatorsDto } from '../../dtos/pos-operator.dto';
import type { SyncPdvCashiersResult } from '../../dtos/pdv-cashier.dto';

export const POS_OPERATOR_SYNC_TTL_HOURS = 48;

/**
 * Pacote offline: memberships elegíveis **com pinHash** + permissionIds.
 * Única rota que devolve hash de PIN.
 */
@Injectable()
export class SyncTerminalOperatorsUseCase implements IUseCase<
  SyncTerminalOperatorsDto,
  SyncPdvCashiersResult
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(
    input: SyncTerminalOperatorsDto,
  ): Promise<SyncPdvCashiersResult> {
    const members = await this.membershipRepository.findAll(
      input.organizationId,
      { activeOnly: true },
    );

    const operators = members
      .filter((detail) => isPdvLoginEligible(detail, input.branchId))
      .map((detail) => ({
        id: detail.user.id,
        membershipId: detail.membership.id,
        code: detail.membership.pdvCode!,
        name:
          detail.user.name?.trim() ||
          detail.user.email ||
          detail.membership.pdvCode!,
        permissionIds: membershipPermissionIds(detail),
        pinHash: detail.membership.pdvPinHash!,
      }));

    const syncedAt = new Date();
    const expiresAt = new Date(
      syncedAt.getTime() + POS_OPERATOR_SYNC_TTL_HOURS * 60 * 60 * 1000,
    );

    return { operators, syncedAt, expiresAt };
  }
}
