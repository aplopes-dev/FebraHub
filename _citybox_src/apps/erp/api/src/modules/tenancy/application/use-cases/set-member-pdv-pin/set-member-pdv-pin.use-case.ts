import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PinHasher } from '../../../../../shared/infra/crypto/pin-hasher';
import { assertValidPin } from '../../../../pos-operators/domain/validators/pos-operator-pin';
import {
  MembershipRepository,
  type MembershipDetail,
} from '../../../domain/repositories/membership.repository.interface';
import { MembershipPdvCodeTakenError } from '../../../domain/errors/membership-pdv-code-taken.error';
import { MembershipNotFoundError } from '../../../domain/errors/membership-not-found.error';

export type SetMemberPdvPinDto = {
  organizationId: string;
  membershipId: string;
  pin: string;
  /** Se informado, atualiza o código junto com o PIN. */
  pdvCode?: string | null;
};

@Injectable()
export class SetMemberPdvPinUseCase implements IUseCase<
  SetMemberPdvPinDto,
  MembershipDetail
> {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async execute(input: SetMemberPdvPinDto): Promise<MembershipDetail> {
    const detail = await this.membershipRepository.findById(
      input.organizationId,
      input.membershipId,
    );
    if (!detail) throw new MembershipNotFoundError(input.membershipId);

    assertValidPin(input.pin);
    const nextCode =
      input.pdvCode !== undefined
        ? input.pdvCode?.trim() || null
        : detail.membership.pdvCode;

    if (!nextCode) {
      throw new MembershipPdvCodeTakenError('(informe o código PDV antes)');
    }

    const conflict = await this.membershipRepository.findByPdvCode(
      input.organizationId,
      nextCode,
    );
    if (conflict && conflict.membership.id !== detail.membership.id) {
      throw new MembershipPdvCodeTakenError(nextCode);
    }

    const pinHash = await PinHasher.hash(input.pin);
    await this.membershipRepository.save(
      detail.membership.setPdvPin(pinHash, nextCode),
    );

    const refreshed = await this.membershipRepository.findById(
      input.organizationId,
      input.membershipId,
    );
    if (!refreshed) throw new MembershipNotFoundError(input.membershipId);
    return refreshed;
  }
}
