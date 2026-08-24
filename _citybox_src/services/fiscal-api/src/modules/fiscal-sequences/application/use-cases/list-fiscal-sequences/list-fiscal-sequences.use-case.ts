import { Injectable } from '@nestjs/common';
import { FiscalSequenceRepository } from '../../../../fiscal-documents/domain/repositories/fiscal-sequence.repository.interface';
import type { FiscalSequence } from '../../../../fiscal-documents/domain/entities/fiscal-sequence.entity';
import type { FiscalDocumentEnvironment } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

export type ListFiscalSequencesInput = {
  companyId: string;
  environment?: FiscalDocumentEnvironment;
  user: AuthenticatedUser;
};

@Injectable()
export class ListFiscalSequencesUseCase {
  constructor(
    private readonly repository: FiscalSequenceRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(input: ListFiscalSequencesInput): Promise<FiscalSequence[]> {
    // Tenant primeiro (404, não 403 — não revela emitente alheio).
    if (
      !(await this.companyAccessPolicy.canActFor(input.companyId, input.user))
    ) {
      throw new CompanyNotFoundError(
        ListFiscalSequencesUseCase.name,
        input.companyId,
      );
    }
    return this.repository.findAllByCompany(input.companyId, input.environment);
  }
}
