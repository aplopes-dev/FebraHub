import { Injectable } from '@nestjs/common';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../shared/infra/http/auth/authenticated-user';
import { SequenceNumberUpdater } from '../../../domain/repositories/sequence-number-updater.interface';
import { FiscalSequenceNumberChange } from '../../../domain/entities/fiscal-sequence-number-change.entity';
import { SeriesNotFoundError } from '../../../domain/errors/series-not-found.error';
import { SeriesNumberDecreaseError } from '../../../domain/errors/series-number-decrease.error';

export type UpdateSequenceNumberInput = {
  sequenceId: string;
  newNumber: number;
  user: AuthenticatedUser;
};

@Injectable()
export class UpdateSequenceNumberUseCase {
  constructor(
    private readonly repository: FiscalSequenceRepository,
    private readonly sequenceNumberUpdater: SequenceNumberUpdater,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(input: UpdateSequenceNumberInput): Promise<FiscalSequence> {
    const sequence = await this.repository.findById(input.sequenceId);
    if (!sequence) {
      throw new SeriesNotFoundError(
        UpdateSequenceNumberUseCase.name,
        input.sequenceId,
      );
    }
    if (
      !(await this.companyAccessPolicy.canActFor(
        sequence.companyId,
        input.user,
      ))
    ) {
      // 404 (não 403) — não revela existência de série de outro emitente.
      throw new SeriesNotFoundError(
        UpdateSequenceNumberUseCase.name,
        input.sequenceId,
      );
    }

    const previous = sequence.currentNumber;
    const next = BigInt(Math.trunc(input.newNumber));

    // Só aumentar (FR-004). Reduzir reemitiria faixa autorizada → bloqueio.
    if (next < previous) {
      throw new SeriesNumberDecreaseError(
        UpdateSequenceNumberUseCase.name,
        previous,
        next,
      );
    }
    if (next === previous) {
      return sequence; // idempotente, sem auditoria
    }

    // Alteração do número + auditoria numa ÚNICA transação (FR-004): um override
    // manual de numeração fiscal nunca pode ficar sem registro (achado da
    // revisão de banco, HIGH).
    const change = FiscalSequenceNumberChange.create({
      sequenceId: sequence.id,
      companyId: sequence.companyId,
      previousNumber: previous,
      newNumber: next,
      changedByUserId: input.user.sub,
      changedByActor: formatAuditActor(input.user),
    });

    return this.sequenceNumberUpdater.applyChange({
      sequence,
      newNumber: next,
      change,
    });
  }
}
