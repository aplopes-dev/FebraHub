import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PDV_CAIXA_WITHDRAWAL_PERMISSION } from '../../../../../shared/infra/http/permissions/permission-catalog';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import { PosCashMovement } from '../../../domain/entities/pos-cash-movement.entity';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import { PosCashSessionNotOpenError } from '../../../domain/errors/pos-cash-session-not-open.error';
import { PosCashSupervisorRequiredError } from '../../../domain/errors/pos-cash-supervisor-required.error';
import { PosCashWithdrawalForbiddenError } from '../../../domain/errors/pos-cash-withdrawal-forbidden.error';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { AddCashMovementDto } from '../../dtos/pos-cash-session.dto';
import { PosSaleOperatorInvalidError } from '../../../../pos-sales/domain/errors/pos-sale-operator-invalid.error';

@Injectable()
export class AddCashMovementUseCase implements IUseCase<
  AddCashMovementDto,
  PosCashMovement
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly getPosPolicy: GetPosPolicyUseCase,
  ) {}

  async execute(input: AddCashMovementDto): Promise<PosCashMovement> {
    if (input.amountCents <= 0) {
      throw new PosSaleOperatorInvalidError(input.operatorUserId);
    }

    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);
    if (!session.isOpen) {
      throw new PosCashSessionNotOpenError(input.sessionId);
    }

    const operator = await this.resolveMembership(
      input.organizationId,
      input.operatorUserId,
      session.branchId,
    );
    const operatorName =
      operator.user.name?.trim() ||
      operator.user.email ||
      operator.membership.pdvCode ||
      'Operador';
    const operatorPerms = membershipPermissionIds(operator);

    let authorizedByUserId: string | null = null;
    let authorizedByName: string | null = null;

    if (input.type === 'withdrawal') {
      const policy = await this.getPosPolicy.execute({
        organizationId: input.organizationId,
      });
      const needsSupervisor = policy.requiresSupervisorForWithdrawal(
        input.amountCents,
      );
      const operatorCanWithdraw = operatorPerms.includes(
        PDV_CAIXA_WITHDRAWAL_PERMISSION,
      );

      if (needsSupervisor && !input.authorizedByUserId) {
        throw new PosCashSupervisorRequiredError(input.amountCents);
      }

      if (input.authorizedByUserId) {
        const authorizer = await this.resolveAuthorizer(
          input.organizationId,
          input.authorizedByUserId,
        );
        const authorizerPerms = membershipPermissionIds(authorizer);
        if (!authorizerPerms.includes(PDV_CAIXA_WITHDRAWAL_PERMISSION)) {
          throw new PosCashWithdrawalForbiddenError();
        }
        authorizedByUserId = input.authorizedByUserId;
        authorizedByName =
          authorizer.user.name?.trim() ||
          authorizer.user.email ||
          authorizer.membership.pdvCode ||
          'Supervisor';
      } else if (!operatorCanWithdraw) {
        throw new PosCashWithdrawalForbiddenError();
      }
    }

    const movement = PosCashMovement.create({
      organizationId: input.organizationId,
      sessionId: session.id,
      type: input.type,
      amountCents: input.amountCents,
      reason: input.reason,
      operation:
        input.type === 'withdrawal' ? 'cashWithdrawal' : 'cashReinforcement',
      operatorUserId: input.operatorUserId,
      operatorName,
      authorizedByUserId,
      authorizedByName,
    });

    return this.cashSessionRepository.addMovement(movement);
  }

  private async resolveMembership(
    organizationId: string,
    userId: string,
    branchId: string,
  ) {
    const membership = await this.membershipRepository.findByUser(
      organizationId,
      userId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(organizationId, membership.id)
      : null;
    if (!detail || !isPdvLoginEligible(detail, branchId)) {
      throw new PosSaleOperatorInvalidError(userId);
    }
    return detail;
  }

  /** Supervisor pode autorizar sem PIN/login de caixa — só precisa da permissão. */
  private async resolveAuthorizer(organizationId: string, userId: string) {
    const membership = await this.membershipRepository.findByUser(
      organizationId,
      userId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(organizationId, membership.id)
      : null;
    if (!detail || !detail.membership.active) {
      throw new PosCashWithdrawalForbiddenError();
    }
    return detail;
  }
}
