import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import type { ListTerminalOperatorsDto } from '../../dtos/pos-operator.dto';
import type { PdvCashierListItem } from '../../dtos/pdv-cashier.dto';

/**
 * Caixas elegíveis da unidade do terminal (Membership com PIN + pdv.operacao.*).
 */
@Injectable()
export class ListTerminalOperatorsUseCase implements IUseCase<
  ListTerminalOperatorsDto,
  PdvCashierListItem[]
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(
    input: ListTerminalOperatorsDto,
  ): Promise<PdvCashierListItem[]> {
    const members = await this.membershipRepository.findAll(
      input.organizationId,
      { activeOnly: true },
    );

    return members
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
      }))
      .sort((a, b) => a.code.localeCompare(b.code, 'pt-BR'));
  }
}
