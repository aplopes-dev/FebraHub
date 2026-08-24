import { Injectable } from '@nestjs/common';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { SeriesNotFoundError } from '../../../domain/errors/series-not-found.error';
import { SeriesInUseError } from '../../../domain/errors/series-in-use.error';

export type DeleteFiscalSequenceInput = {
  sequenceId: string;
  user: AuthenticatedUser;
};

@Injectable()
export class DeleteFiscalSequenceUseCase {
  constructor(
    private readonly repository: FiscalSequenceRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(input: DeleteFiscalSequenceInput): Promise<void> {
    const sequence = await this.repository.findById(input.sequenceId);
    if (!sequence) {
      throw new SeriesNotFoundError(
        DeleteFiscalSequenceUseCase.name,
        input.sequenceId,
      );
    }
    if (
      !(await this.companyAccessPolicy.canActFor(
        sequence.companyId,
        input.user,
      ))
    ) {
      throw new SeriesNotFoundError(
        DeleteFiscalSequenceUseCase.name,
        input.sequenceId,
      );
    }

    // Só série nunca usada pode ser excluída (FR-005). Usada = histórico fiscal.
    if (sequence.currentNumber > 0n) {
      throw new SeriesInUseError(
        DeleteFiscalSequenceUseCase.name,
        sequence.currentNumber,
      );
    }

    await this.repository.delete(sequence.id);
  }
}
