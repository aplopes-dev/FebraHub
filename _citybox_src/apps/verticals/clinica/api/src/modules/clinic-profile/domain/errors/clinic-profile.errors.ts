import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ClinicProfileHasNoLogoError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Clinic profile for store "${storeId}" has no logo`,
      externalMessage: 'A clínica não possui logotipo',
      context,
    });
  }
}
