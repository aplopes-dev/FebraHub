import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import type {
  FiscalDocumentEnvironment,
  FiscalDocumentType,
} from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { canonicalizeSeries } from '../../../domain/series-format';
import { SeriesDuplicateError } from '../../../domain/errors/series-duplicate.error';

export type CreateFiscalSequenceInput = {
  companyId: string;
  documentType: FiscalDocumentType;
  series: string;
  initialNumber?: number;
  environment: FiscalDocumentEnvironment;
  user: AuthenticatedUser;
};

@Injectable()
export class CreateFiscalSequenceUseCase {
  constructor(
    private readonly repository: FiscalSequenceRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(input: CreateFiscalSequenceInput): Promise<FiscalSequence> {
    if (
      !(await this.companyAccessPolicy.canActFor(input.companyId, input.user))
    ) {
      throw new CompanyNotFoundError(
        CreateFiscalSequenceUseCase.name,
        input.companyId,
      );
    }

    const series = canonicalizeSeries(
      CreateFiscalSequenceUseCase.name,
      input.series,
    );

    // Duplicidade → 409, não erro de banco (FR-003).
    const existing = await this.repository.findByKey({
      companyId: input.companyId,
      documentType: input.documentType,
      series,
      environment: input.environment,
    });
    if (existing) {
      throw new SeriesDuplicateError(CreateFiscalSequenceUseCase.name, series);
    }

    const initial = BigInt(Math.max(0, Math.trunc(input.initialNumber ?? 0)));
    const sequence = FiscalSequence.with(
      {
        companyId: input.companyId,
        documentType: input.documentType,
        series,
        currentNumber: initial,
        environment: input.environment,
        active: true,
      },
      randomUUID(),
    );
    return this.repository.save(sequence);
  }
}
