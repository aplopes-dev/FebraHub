import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import { isPdvLoginEligible } from '../../../../tenancy/domain/pdv-membership';
import { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { PosCashSessionOpenTakenError } from '../../../domain/errors/pos-cash-session-open-taken.error';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { OpenCashSessionDto } from '../../dtos/pos-cash-session.dto';
import { PosSaleOperatorInvalidError } from '../../../../pos-sales/domain/errors/pos-sale-operator-invalid.error';

@Injectable()
export class OpenCashSessionUseCase implements IUseCase<
  OpenCashSessionDto,
  PosCashSession
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async execute(input: OpenCashSessionDto): Promise<PosCashSession> {
    const existing = await this.cashSessionRepository.findOpenByTerminal(
      input.organizationId,
      input.posTerminalId,
    );
    if (existing) {
      throw new PosCashSessionOpenTakenError(input.posTerminalId);
    }

    const membership = await this.membershipRepository.findByUser(
      input.organizationId,
      input.operatorUserId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(
          input.organizationId,
          membership.id,
        )
      : null;
    if (!detail || !isPdvLoginEligible(detail, input.branchId)) {
      throw new PosSaleOperatorInvalidError(input.operatorUserId);
    }

    const openedByName =
      detail.user.name?.trim() ||
      detail.user.email ||
      detail.membership.pdvCode ||
      'Operador';

    const session = PosCashSession.create({
      organizationId: input.organizationId,
      branchId: input.branchId,
      posTerminalId: input.posTerminalId,
      openedByUserId: input.operatorUserId,
      openedByName,
      openingFloatCents: input.openingFloatCents,
    });

    return this.cashSessionRepository.save(session);
  }
}
