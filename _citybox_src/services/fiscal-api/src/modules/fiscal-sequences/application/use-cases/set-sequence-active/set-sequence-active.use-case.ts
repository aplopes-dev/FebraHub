import { Injectable } from '@nestjs/common';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { SeriesNotFoundError } from '../../../domain/errors/series-not-found.error';

export type SetSequenceActiveInput = {
  sequenceId: string;
  active: boolean;
  user: AuthenticatedUser;
};

@Injectable()
export class SetSequenceActiveUseCase {
  constructor(
    private readonly repository: FiscalSequenceRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(input: SetSequenceActiveInput): Promise<FiscalSequence> {
    const sequence = await this.repository.findById(input.sequenceId);
    if (!sequence) {
      throw new SeriesNotFoundError(
        SetSequenceActiveUseCase.name,
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
        SetSequenceActiveUseCase.name,
        input.sequenceId,
      );
    }

    const updated = FiscalSequence.with(
      {
        companyId: sequence.companyId,
        documentType: sequence.documentType,
        series: sequence.series,
        currentNumber: sequence.currentNumber,
        environment: sequence.environment,
        active: input.active,
      },
      sequence.id,
    );
    return this.repository.save(updated);
  }
}
