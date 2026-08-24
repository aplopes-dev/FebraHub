import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import { assertValidPin } from '../../../domain/validators/pos-operator-pin';
import { PosOperatorCredentialsUnauthorizedError } from '../../../domain/errors/pos-operator-credentials-unauthorized.error';
import { PosOperatorLockedError } from '../../../domain/errors/pos-operator-locked.error';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import type { AuthenticatePosOperatorDto } from '../../dtos/pos-operator.dto';
import type { PdvCashierSession } from '../../dtos/pdv-cashier.dto';

/**
 * Entrada do caixa no PDV: código + PIN de um **Membership** elegível.
 *
 * A unidade vem do terminal (`DeviceAuthGuard`), nunca do corpo.
 * `id` da sessão = `userId` (ledger / auditoria).
 */
@Injectable()
export class AuthenticatePosOperatorUseCase implements IUseCase<
  AuthenticatePosOperatorDto,
  PdvCashierSession
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(input: AuthenticatePosOperatorDto): Promise<PdvCashierSession> {
    const detail = await this.membershipRepository.findByPdvCode(
      input.organizationId,
      input.code,
    );

    if (!detail || !isPdvLoginEligible(detail, input.branchId)) {
      throw new PosOperatorCredentialsUnauthorizedError();
    }

    const { membership, user } = detail;
    if (membership.isPdvLocked()) {
      throw new PosOperatorLockedError(membership.pdvLockedUntil!);
    }

    assertValidPin(input.pin);
    const matches = await PinHasher.verify(input.pin, membership.pdvPinHash!);
    if (!matches) {
      const penalized = await this.membershipRepository.save(
        membership.registerPdvFailedAttempt(),
      );
      if (penalized.isPdvLocked()) {
        throw new PosOperatorLockedError(penalized.pdvLockedUntil!);
      }
      throw new PosOperatorCredentialsUnauthorizedError();
    }

    const unlocked = await this.membershipRepository.save(
      membership.registerPdvSuccessfulAttempt(),
    );

    return {
      id: unlocked.userId,
      membershipId: unlocked.id,
      code: unlocked.pdvCode!,
      name: user.name?.trim() || user.email || unlocked.pdvCode!,
      permissionIds: membershipPermissionIds(detail),
      active: unlocked.active,
      locked: false,
      lockedUntil: null,
    };
  }
}
