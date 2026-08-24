import { DomainError } from '../../../../shared/core/errors/domain.error';

export class CompanyNotFoundError extends DomainError {
  constructor(context: string, companyId: string) {
    super({
      internalMessage: `Company "${companyId}" not found`,
      externalMessage: 'Empresa emissora não encontrada',
      context,
    });
  }
}
