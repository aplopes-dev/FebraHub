import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { computeExpectedCashCents } from '../../../domain/cash-expected';
import type { PosCashSession } from '../../../domain/entities/pos-cash-session.entity';
import { PosCashSessionNotFoundError } from '../../../domain/errors/pos-cash-session-not-found.error';
import { PosCashSessionNotOpenError } from '../../../domain/errors/pos-cash-session-not-open.error';
import { PosCashSessionRepository } from '../../../domain/repositories/pos-cash-session.repository.interface';
import type { CloseCashSessionDto } from '../../dtos/pos-cash-session.dto';

@Injectable()
export class CloseCashSessionUseCase implements IUseCase<
  CloseCashSessionDto,
  PosCashSession
> {
  constructor(
    private readonly cashSessionRepository: PosCashSessionRepository,
  ) {}

  async execute(input: CloseCashSessionDto): Promise<PosCashSession> {
    const session = await this.cashSessionRepository.findById(
      input.organizationId,
      input.sessionId,
    );
    if (!session) throw new PosCashSessionNotFoundError(input.sessionId);
    if (!session.isOpen) {
      throw new PosCashSessionNotOpenError(input.sessionId);
    }

    const [movements, cashSalesCents] = await Promise.all([
      this.cashSessionRepository.sumMovementsByType(
        input.organizationId,
        session.id,
      ),
      this.cashSessionRepository.sumCashPaymentsCents(
        input.organizationId,
        session.id,
      ),
    ]);

    const expectedCashCents = computeExpectedCashCents({
      openingFloatCents: session.openingFloatCents,
      reinforcementCents: movements.reinforcementCents,
      withdrawalCents: movements.withdrawalCents,
      cashSalesCents,
    });

    const closed = session.close({
      countedCashCents: input.countedCashCents,
      countedCreditCents: input.countedCreditCents,
      countedDebitCents: input.countedDebitCents,
      countedVoucherCents: input.countedVoucherCents,
      countedOtherCents: input.countedOtherCents,
      expectedCashCents,
    });

    return this.cashSessionRepository.save(closed);
  }
}
